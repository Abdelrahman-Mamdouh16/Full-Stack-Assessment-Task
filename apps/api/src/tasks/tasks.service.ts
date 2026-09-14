import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type FilterQuery, Model, Types } from 'mongoose';
import type { Paginated, TaskDetail, TaskSummary } from '@projectflow/shared';
import { toUserSummary } from '../common/utils/serialize';
import { Comment, type CommentDocument } from '../comments/schemas/comment.schema';
import { ProjectMembersService } from '../project-members/project-members.service';
import { canManage, ProjectAccessService } from '../projects/project-access.service';
import { Project, type ProjectDocument } from '../projects/schemas/project.schema';
import { TaskActivityService } from '../task-activity/task-activity.service';
import { UsersService } from '../users/users.service';
import type { AssignTaskDto } from './dto/assign-task.dto';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { ListTasksQueryDto } from './dto/list-tasks.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';
import type { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { ProjectCounter, type ProjectCounterDocument } from './schemas/project-counter.schema';
import { Task, type TaskDocument } from './schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
    @InjectModel(ProjectCounter.name)
    private readonly projectCounterModel: Model<ProjectCounterDocument>,
    private readonly projectAccessService: ProjectAccessService,
    private readonly projectMembersService: ProjectMembersService,
    private readonly taskActivityService: TaskActivityService,
    private readonly usersService: UsersService,
  ) {}

  async findByProject(
    projectId: Types.ObjectId,
    userId: Types.ObjectId,
    query: ListTasksQueryDto,
  ): Promise<Paginated<TaskSummary>> {
    await this.projectAccessService.assertCanView(projectId, userId);

    const filter: FilterQuery<TaskDocument> = { projectId };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    const [tasks, total] = await Promise.all([
      this.taskModel.find(filter).sort({ number: 1 }).skip(query.skip).limit(query.pageSize).exec(),
      this.taskModel.countDocuments(filter),
    ]);

    return {
      items: await this.toSummaries(tasks),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async create(
    projectId: Types.ObjectId,
    userId: Types.ObjectId,
    dto: CreateTaskDto,
  ): Promise<TaskDetail> {
    const { project } = await this.projectAccessService.assertCanView(projectId, userId);

    const counter = await this.projectCounterModel.findOneAndUpdate(
      { projectId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    const number = counter.seq;

    const task = await this.taskModel.create({
      projectId,
      number,
      key: `${project.key}-${number}`,
      title: dto.title,
      description: dto.description ?? null,
      status: dto.status,
      priority: dto.priority,
      createdBy: userId,
    });

    return this.toDetail(task, project);
  }

  async findOne(taskId: Types.ObjectId, userId: Types.ObjectId): Promise<TaskDetail> {
    const task = await this.findTaskOrFail(taskId);
    const { project } = await this.projectAccessService.assertCanView(task.projectId, userId);

    return this.toDetail(task, project);
  }

  async update(
    taskId: Types.ObjectId,
    userId: Types.ObjectId,
    dto: UpdateTaskDto,
  ): Promise<TaskDetail> {
    const task = await this.findTaskOrFail(taskId);
    const access = await this.projectAccessService.assertCanView(task.projectId, userId);

    const isCreator = task.createdBy.equals(userId);

    if (!canManage(access) && !isCreator) {
      throw new ForbiddenException('You do not have permission to edit this task');
    }

    if (dto.title !== undefined) {
      task.title = dto.title;
    }

    if (dto.description !== undefined) {
      task.description = dto.description;
    }

    if (dto.status !== undefined) {
      task.status = dto.status;
    }

    if (dto.priority !== undefined) {
      task.priority = dto.priority;
    }

    await task.save();

    return this.toDetail(task, access.project);
  }

  async updateStatus(
    taskId: Types.ObjectId,
    userId: Types.ObjectId,
    dto: UpdateTaskStatusDto,
  ): Promise<TaskDetail> {
    const task = await this.findTaskOrFail(taskId);
    const access = await this.projectAccessService.assertCanView(task.projectId, userId);

    task.status = dto.status;
    await task.save();

    return this.toDetail(task, access.project);
  }

  async assignTask(
    taskId: Types.ObjectId,
    actorId: Types.ObjectId,
    dto: AssignTaskDto,
  ): Promise<TaskDetail> {
    const task = await this.findTaskOrFail(taskId);
    const access = await this.projectAccessService.assertCanView(task.projectId, actorId);

    const previousAssigneeId = task.assignee ?? null;

    // Case 1: Unassignment
    if (dto.assigneeId === null) {
      const isManager = canManage(access);
      const isCurrentAssignee = task.assignee?.equals(actorId) ?? false;

      if (!isManager && !isCurrentAssignee) {
        throw new ForbiddenException('You do not have permission to unassign this task');
      }

      // No state change if the task is already unassigned.
      if (previousAssigneeId === null) {
        return this.toDetail(task, access.project);
      }

      task.assignee = null;
      await task.save();

      await this.taskActivityService.recordTransition({
        taskId: task._id,
        projectId: task.projectId,
        actorId,
        type: 'TASK_ASSIGNEE_CHANGED',
        fromUserId: previousAssigneeId,
        toUserId: null,
      });

      return this.toDetail(task, access.project);
    }

    if (dto.assigneeId === undefined) {
      throw new BadRequestException(
        'assigneeId must be provided as a valid MongoDB ObjectId or null',
      );
    }

    const assigneeObjectId = new Types.ObjectId(dto.assigneeId);

    // No state change if the task is already assigned to this user.
    if (previousAssigneeId?.equals(assigneeObjectId)) {
      return this.toDetail(task, access.project);
    }

    // The target user must exist and already be a member of this project.
    const [assigneeUser, membership] = await Promise.all([
      this.usersService.findById(assigneeObjectId),
      this.projectMembersService.findExisting(task.projectId, assigneeObjectId),
    ]);

    if (!assigneeUser) {
      throw new NotFoundException('User not found');
    }

    if (!membership) {
      throw new BadRequestException('Assignee must be a member of this project');
    }

    // OWNER / ADMIN / PROJECT_MANAGER can assign any project member.
    // Regular MEMBER can only assign the task to themselves.
    const isManager = canManage(access);
    const isSelfAssignment = assigneeObjectId.equals(actorId);

    if (!isManager && !isSelfAssignment) {
      throw new ForbiddenException('Members can only assign tasks to themselves');
    }

    task.assignee = assigneeObjectId;
    await task.save();

    await this.taskActivityService.recordTransition({
      taskId: task._id,
      projectId: task.projectId,
      actorId,
      type: 'TASK_ASSIGNEE_CHANGED',
      fromUserId: previousAssigneeId,
      toUserId: assigneeObjectId,
    });

    return this.toDetail(task, access.project);
  }

  async remove(taskId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    const task = await this.findTaskOrFail(taskId);

    await this.projectAccessService.assertCanManage(task.projectId, userId);

    await Promise.all([this.commentModel.deleteMany({ taskId: task._id }), task.deleteOne()]);
  }

  async findTaskOrFail(taskId: Types.ObjectId): Promise<TaskDocument> {
    const task = await this.taskModel.findById(taskId).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async toSummaries(tasks: TaskDocument[]): Promise<TaskSummary[]> {
    if (tasks.length === 0) {
      return [];
    }

    const creatorIds = tasks.map((task) => task.createdBy);

    const assigneeIds = tasks
      .map((task) => task.assignee)
      .filter((id): id is Types.ObjectId => Boolean(id));

    const userIdsToFetch = Array.from(
      new Set([...creatorIds, ...assigneeIds].map((id) => id.toString())),
    ).map((id) => new Types.ObjectId(id));

    const [users, commentRows] = await Promise.all([
      this.usersService.findManyByIds(userIdsToFetch),
      this.commentModel
        .aggregate<{
          _id: Types.ObjectId;
          count: number;
        }>([
          { $match: { taskId: { $in: tasks.map((task) => task._id) } } },
          { $group: { _id: '$taskId', count: { $sum: 1 } } },
        ])
        .exec(),
    ]);

    const usersById = new Map(users.map((user) => [user._id.toString(), user]));
    const commentCounts = new Map(commentRows.map((row) => [row._id.toString(), row.count]));

    return tasks.map((task) => {
      const assigneeUser = task.assignee ? usersById.get(task.assignee.toString()) : null;

      return {
        id: task._id.toString(),
        projectId: task.projectId.toString(),
        number: task.number,
        key: task.key,
        title: task.title,
        status: task.status,
        priority: task.priority,
        assignee: assigneeUser ? toUserSummary(assigneeUser) : null,
        commentCount: commentCounts.get(task._id.toString()) ?? 0,
        createdBy: toCreatorSummary(usersById.get(task.createdBy.toString())),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      };
    });
  }

  private async toDetail(task: TaskDocument, project?: ProjectDocument): Promise<TaskDetail> {
    const [summary] = await this.toSummaries([task]);

    const resolvedProject = project ?? (await this.projectModel.findById(task.projectId).exec());

    if (!resolvedProject) {
      throw new NotFoundException('Project not found');
    }

    return {
      ...summary!,
      description: task.description ?? null,
      project: {
        id: resolvedProject._id.toString(),
        name: resolvedProject.name,
        key: resolvedProject.key,
      },
    };
  }
}

const DELETED_USER = {
  id: '',
  name: 'Unknown user',
  email: '',
  avatarUrl: null,
};

function toCreatorSummary(user: Parameters<typeof toUserSummary>[0] | undefined) {
  return user ? toUserSummary(user) : DELETED_USER;
}

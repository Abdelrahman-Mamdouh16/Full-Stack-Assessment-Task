import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type {
  Paginated,
  TaskActivityEntry,
  TaskActivityType,
  UserSummary,
} from '@projectflow/shared';
import { toUserSummary } from '../common/utils/serialize';
import { UsersService } from '../users/users.service';
import { TaskActivity, type TaskActivityDocument } from './schemas/task-activity.schema';

@Injectable()
export class TaskActivityService {
  constructor(
    @InjectModel(TaskActivity.name)
    private readonly taskActivityModel: Model<TaskActivityDocument>,
    private readonly usersService: UsersService,
  ) {}

  async recordTransition(params: {
    taskId: Types.ObjectId;
    projectId: Types.ObjectId;
    actorId: Types.ObjectId;
    type: TaskActivityType;
    fromUserId: Types.ObjectId | null;
    toUserId: Types.ObjectId | null;
  }): Promise<TaskActivityDocument> {
    return this.taskActivityModel.create({
      taskId: params.taskId,
      projectId: params.projectId,
      actorId: params.actorId,
      type: params.type,
      fromUserId: params.fromUserId,
      toUserId: params.toUserId,
    });
  }

  async findByTask(
    taskId: Types.ObjectId,
    page: number,
    pageSize: number,
  ): Promise<Paginated<TaskActivityEntry>> {
    const skip = (page - 1) * pageSize;

    const [activities, total] = await Promise.all([
      this.taskActivityModel
        .find({ taskId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.taskActivityModel.countDocuments({ taskId }),
    ]);

    if (activities.length === 0) {
      return {
        items: [],
        total,
        page,
        pageSize,
      };
    }

    const userIds = new Set<string>();

    for (const act of activities) {
      userIds.add(act.actorId.toString());

      if (act.fromUserId) {
        userIds.add(act.fromUserId.toString());
      }

      if (act.toUserId) {
        userIds.add(act.toUserId.toString());
      }
    }

    const users = await this.usersService.findManyByIds(
      Array.from(userIds).map((id) => new Types.ObjectId(id)),
    );

    const usersById = new Map(users.map((user) => [user._id.toString(), toUserSummary(user)]));

    const items = activities.map((act) => {
      const actor = usersById.get(act.actorId.toString()) ?? DELETED_USER;

      const fromUser = act.fromUserId ? (usersById.get(act.fromUserId.toString()) ?? null) : null;

      const toUser = act.toUserId ? (usersById.get(act.toUserId.toString()) ?? null) : null;

      return {
        id: act._id.toString(),
        taskId: act.taskId.toString(),
        projectId: act.projectId.toString(),
        type: act.type,
        actor,
        metadata: {
          from: fromUser,
          to: toUser,
        },
        createdAt: act.createdAt.toISOString(),
      };
    });

    return {
      items,
      total,
      page,
      pageSize,
    };
  }
}

const DELETED_USER: UserSummary = {
  id: '',
  name: 'Unknown user',
  email: '',
  avatarUrl: null,
};

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { CommentEntry, Paginated } from '@projectflow/shared';
import type { PaginationQueryDto } from '../common/dto/pagination.dto';
import { toUserSummary } from '../common/utils/serialize';
import { ProjectAccessService } from '../projects/project-access.service';
import { TasksService } from '../tasks/tasks.service';
import { UsersService } from '../users/users.service';
import type { CreateCommentDto } from './dto/create-comment.dto';
import { Comment, type CommentDocument } from './schemas/comment.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
    private readonly tasksService: TasksService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly usersService: UsersService,
  ) {}

  async findByTask(
    taskId: Types.ObjectId,
    userId: Types.ObjectId,
    query: PaginationQueryDto,
  ): Promise<Paginated<CommentEntry>> {
    const task = await this.tasksService.findTaskOrFail(taskId);
    await this.projectAccessService.assertCanView(task.projectId, userId);

    const [comments, total] = await Promise.all([
      this.commentModel
        .find({ taskId })
        .sort({ createdAt: 1 })
        .skip(query.skip)
        .limit(query.pageSize)
        .exec(),
      this.commentModel.countDocuments({ taskId }),
    ]);

    return {
      items: await this.toEntries(comments),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async create(
    taskId: Types.ObjectId,
    userId: Types.ObjectId,
    dto: CreateCommentDto,
  ): Promise<CommentEntry> {
    const task = await this.tasksService.findTaskOrFail(taskId);
    await this.projectAccessService.assertCanView(task.projectId, userId);

    const author = await this.usersService.findByIdOrFail(userId);
    const comment = await this.commentModel.create({
      taskId,
      authorId: userId,
      content: dto.content,
    });

    return {
      id: comment._id.toString(),
      taskId: comment.taskId.toString(),
      content: comment.content,
      author: toUserSummary(author),
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }

  private async toEntries(comments: CommentDocument[]): Promise<CommentEntry[]> {
    if (comments.length === 0) {
      return [];
    }

    const authors = await this.usersService.findManyByIds(
      comments.map((comment) => comment.authorId),
    );
    const authorsById = new Map(authors.map((user) => [user._id.toString(), user]));

    return comments.flatMap((comment) => {
      const author = authorsById.get(comment.authorId.toString());
      if (!author) {
        return [];
      }
      return [
        {
          id: comment._id.toString(),
          taskId: comment.taskId.toString(),
          content: comment.content,
          author: toUserSummary(author),
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
        },
      ];
    });
  }
}

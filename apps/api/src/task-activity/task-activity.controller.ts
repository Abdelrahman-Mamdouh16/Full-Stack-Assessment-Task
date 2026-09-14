import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Paginated, TaskActivityEntry } from '@projectflow/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { toObjectId } from '../common/utils/object-id';
import { ProjectAccessService } from '../projects/project-access.service';
import { Task, type TaskDocument } from '../tasks/schemas/task.schema';
import { TaskActivityService } from './task-activity.service';
import { ListTaskActivityQueryDto } from './dto/list-task-activity.dto';

@Controller()
export class TaskActivityController {
  constructor(
    private readonly taskActivityService: TaskActivityService,
    private readonly projectAccessService: ProjectAccessService,
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
  ) {}

  @Get('tasks/:taskId/activity')
  async findByTask(
    @Param('taskId') taskId: string,
    @CurrentUser('id') userId: string,
    @Query() query: ListTaskActivityQueryDto,
  ): Promise<Paginated<TaskActivityEntry>> {
    const taskObjectId = toObjectId(taskId, 'task id');
    const userObjectId = toObjectId(userId, 'user id');

    const task = await this.taskModel.findById(taskObjectId).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.projectAccessService.assertCanView(task.projectId, userObjectId);

    return this.taskActivityService.findByTask(taskObjectId, query.page, query.pageSize);
  }
}

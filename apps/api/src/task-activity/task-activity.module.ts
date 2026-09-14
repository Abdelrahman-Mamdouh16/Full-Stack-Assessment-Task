import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsModule } from '../projects/projects.module';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { UsersModule } from '../users/users.module';
import { TaskActivity, TaskActivitySchema } from './schemas/task-activity.schema';
import { TaskActivityController } from './task-activity.controller';
import { TaskActivityService } from './task-activity.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaskActivity.name, schema: TaskActivitySchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    ProjectsModule,
    UsersModule,
  ],
  controllers: [TaskActivityController],
  providers: [TaskActivityService],
  exports: [TaskActivityService, MongooseModule],
})
export class TaskActivityModule {}

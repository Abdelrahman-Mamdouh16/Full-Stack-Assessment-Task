import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from '../comments/schemas/comment.schema';
import { ProjectMembersModule } from '../project-members/project-members.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { ProjectCounter, ProjectCounterSchema } from './schemas/project-counter.schema';
import { Task, TaskSchema } from './schemas/task.schema';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: ProjectCounter.name, schema: ProjectCounterSchema },
    ]),
    ProjectsModule,
    ProjectMembersModule,
    UsersModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService, MongooseModule],
})
export class TasksModule {}

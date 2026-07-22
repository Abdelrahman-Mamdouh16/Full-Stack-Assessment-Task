import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationMembersModule } from '../organization-members/organization-members.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ProjectMembersModule } from '../project-members/project-members.module';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { UsersModule } from '../users/users.module';
import { ProjectAccessService } from './project-access.service';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project, ProjectSchema } from './schemas/project.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    OrganizationsModule,
    OrganizationMembersModule,
    ProjectMembersModule,
    UsersModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectAccessService],
  exports: [ProjectAccessService, MongooseModule],
})
export class ProjectsModule {}

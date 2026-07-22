import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectMembersService } from './project-members.service';
import { ProjectMember, ProjectMemberSchema } from './schemas/project-member.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ProjectMember.name, schema: ProjectMemberSchema }])],
  providers: [ProjectMembersService],
  exports: [ProjectMembersService, MongooseModule],
})
export class ProjectMembersModule {}

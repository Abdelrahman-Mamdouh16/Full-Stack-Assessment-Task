import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { ProjectDetail, ProjectMemberEntry, ProjectSummary } from '@projectflow/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { toObjectId } from '../common/utils/object-id';
import { AddProjectMemberDto } from '../project-members/dto/add-project-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string): Promise<ProjectSummary[]> {
    return this.projectsService.findAllForUser(toObjectId(userId, 'user id'));
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateProjectDto): Promise<ProjectDetail> {
    return this.projectsService.create(toObjectId(userId, 'user id'), dto);
  }

  @Get(':projectId')
  findOne(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ProjectDetail> {
    return this.projectsService.findOne(
      toObjectId(projectId, 'project id'),
      toObjectId(userId, 'user id'),
    );
  }

  @Get(':projectId/members')
  findMembers(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ProjectMemberEntry[]> {
    return this.projectsService.findMembers(
      toObjectId(projectId, 'project id'),
      toObjectId(userId, 'user id'),
    );
  }

  @Post(':projectId/members')
  addMember(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddProjectMemberDto,
  ): Promise<ProjectMemberEntry> {
    return this.projectsService.addMember(
      toObjectId(projectId, 'project id'),
      toObjectId(userId, 'user id'),
      dto,
    );
  }
}

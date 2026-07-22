import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  isElevatedOrganizationRole,
  type OrganizationRole,
  ProjectRole,
} from '@projectflow/shared';
import { OrganizationMembersService } from '../organization-members/organization-members.service';
import { ProjectMembersService } from '../project-members/project-members.service';
import { Project, type ProjectDocument } from './schemas/project.schema';

export interface ProjectAccessContext {
  project: ProjectDocument;
  organizationRole: OrganizationRole | null;
  projectRole: ProjectRole | null;
}

/**
 * Single place where "may this user touch this project?" is answered.
 *
 * Access comes from either an elevated organization role (OWNER/ADMIN grants
 * access to every project in the organization) or an explicit project
 * membership row.
 */
@Injectable()
export class ProjectAccessService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    private readonly organizationMembersService: OrganizationMembersService,
    private readonly projectMembersService: ProjectMembersService,
  ) {}

  async resolve(projectId: Types.ObjectId, userId: Types.ObjectId): Promise<ProjectAccessContext> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const [organizationRole, projectRole] = await Promise.all([
      this.organizationMembersService.findRole(project.organizationId, userId),
      this.projectMembersService.findRole(project._id, userId),
    ]);

    return { project, organizationRole, projectRole };
  }

  /** Throws unless the user can read the project and its tasks. */
  async assertCanView(
    projectId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ProjectAccessContext> {
    const context = await this.resolve(projectId, userId);
    if (!canView(context)) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return context;
  }

  /** Throws unless the user can change project configuration or membership. */
  async assertCanManage(
    projectId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ProjectAccessContext> {
    const context = await this.assertCanView(projectId, userId);
    if (!canManage(context)) {
      throw new ForbiddenException('You do not have permission to manage this project');
    }
    return context;
  }
}

export function canView(context: ProjectAccessContext): boolean {
  return isElevatedOrganizationRole(context.organizationRole) || context.projectRole !== null;
}

export function canManage(context: ProjectAccessContext): boolean {
  return (
    isElevatedOrganizationRole(context.organizationRole) ||
    context.projectRole === ProjectRole.PROJECT_MANAGER
  );
}

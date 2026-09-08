import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  isElevatedOrganizationRole,
  type ProjectDetail,
  type ProjectMemberEntry,
  ProjectRole,
  type ProjectSummary,
} from '@projectflow/shared';
import { toUserSummary } from '../common/utils/serialize';
import { OrganizationMembersService } from '../organization-members/organization-members.service';
import { OrganizationsService } from '../organizations/organizations.service';
import type { AddProjectMemberDto } from '../project-members/dto/add-project-member.dto';
import { ProjectMembersService } from '../project-members/project-members.service';
import { Task, type TaskDocument } from '../tasks/schemas/task.schema';
import { UsersService } from '../users/users.service';
import type { CreateProjectDto } from './dto/create-project.dto';
import { ProjectAccessService } from './project-access.service';
import { Project, type ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly projectAccessService: ProjectAccessService,
    private readonly projectMembersService: ProjectMembersService,
    private readonly organizationMembersService: OrganizationMembersService,
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
  ) {}

  /** Every project the user can reach, via elevated org role or membership. */
  async findAllForUser(userId: Types.ObjectId): Promise<ProjectSummary[]> {
    const [organizationMemberships, memberProjectIds] = await Promise.all([
      this.organizationMembersService.findByUser(userId),
      this.projectMembersService.findProjectIdsByUser(userId),
    ]);

    const elevatedOrganizationIds = organizationMemberships
      .filter((membership) => isElevatedOrganizationRole(membership.role))
      .map((membership) => membership.organizationId);

    if (elevatedOrganizationIds.length === 0 && memberProjectIds.length === 0) {
      return [];
    }

    const projects = await this.projectModel
      .find({
        $or: [
          { organizationId: { $in: elevatedOrganizationIds } },
          { _id: { $in: memberProjectIds } },
        ],
      })
      .sort({ createdAt: 1 })
      .exec();

    return this.withCounts(projects);
  }

  async findOne(projectId: Types.ObjectId, userId: Types.ObjectId): Promise<ProjectDetail> {
    const { project } = await this.projectAccessService.assertCanView(projectId, userId);

    const [summary] = await this.withCounts([project]);
    const [organization, creator] = await Promise.all([
      this.organizationsService.findById(project.organizationId),
      this.usersService.findByIdOrFail(project.createdBy),
    ]);

    return {
      ...summary!,
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
      },
      createdBy: toUserSummary(creator),
    };
  }

  async findMembers(
    projectId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ProjectMemberEntry[]> {
    await this.projectAccessService.assertCanView(projectId, userId);

    const memberships = await this.projectMembersService.findByProject(projectId);
    if (memberships.length === 0) {
      return [];
    }

    const users = await this.usersService.findManyByIds(
      memberships.map((membership) => membership.userId),
    );
    const usersById = new Map(users.map((user) => [user._id.toString(), user]));

    return memberships.flatMap((membership) => {
      const user = usersById.get(membership.userId.toString());
      if (!user) {
        return [];
      }
      return [
        {
          id: membership._id.toString(),
          projectId: membership.projectId.toString(),
          role: membership.role,
          user: toUserSummary(user),
          createdAt: membership.createdAt.toISOString(),
        },
      ];
    });
  }

  async create(userId: Types.ObjectId, dto: CreateProjectDto): Promise<ProjectDetail> {
    const organizationId = new Types.ObjectId(dto.organizationId);
    const organizationRole = await this.organizationMembersService.findRole(organizationId, userId);

    if (!isElevatedOrganizationRole(organizationRole)) {
      throw new ForbiddenException('You do not have permission to create projects here');
    }

    const key = dto.key.toUpperCase();
    const duplicate = await this.projectModel.exists({ organizationId, key });
    if (duplicate) {
      throw new ConflictException(`Project key ${key} is already used in this organization`);
    }

    const project = await this.projectModel.create({
      organizationId,
      name: dto.name,
      key,
      description: dto.description ?? null,
      createdBy: userId,
    });

    await this.projectMembersService.add(project._id, userId, ProjectRole.PROJECT_MANAGER);

    return this.findOne(project._id, userId);
  }

  async addMember(
    projectId: Types.ObjectId,
    actingUserId: Types.ObjectId,
    dto: AddProjectMemberDto,
  ): Promise<ProjectMemberEntry> {
    const { project } = await this.projectAccessService.assertCanManage(projectId, actingUserId);

    const targetUserId = new Types.ObjectId(dto.userId);
    const user = await this.usersService.findByIdOrFail(targetUserId);

    const organizationRole = await this.organizationMembersService.findRole(
      project.organizationId,
      targetUserId,
    );
    if (!organizationRole) {
      throw new BadRequestException('User does not belong to this organization');
    }

    const existing = await this.projectMembersService.findExisting(projectId, targetUserId);
    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    const membership = await this.projectMembersService.add(projectId, targetUserId, dto.role);

    return {
      id: membership._id.toString(),
      projectId: membership.projectId.toString(),
      role: membership.role,
      user: toUserSummary(user),
      createdAt: membership.createdAt.toISOString(),
    };
  }

  private async withCounts(projects: ProjectDocument[]): Promise<ProjectSummary[]> {
    const projectIds = projects.map((project) => project._id);

    const [memberCounts, taskCountRows] = await Promise.all([
      this.projectMembersService.countByProjects(projectIds),
      this.taskModel
        .aggregate<{
          _id: Types.ObjectId;
          count: number;
        }>([
          { $match: { projectId: { $in: projectIds } } },
          { $group: { _id: '$projectId', count: { $sum: 1 } } },
        ])
        .exec(),
    ]);

    const taskCounts = new Map(taskCountRows.map((row) => [row._id.toString(), row.count]));

    return projects.map((project) => ({
      id: project._id.toString(),
      organizationId: project.organizationId.toString(),
      name: project.name,
      key: project.key,
      description: project.description ?? null,
      memberCount: memberCounts.get(project._id.toString()) ?? 0,
      taskCount: taskCounts.get(project._id.toString()) ?? 0,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }));
  }
}

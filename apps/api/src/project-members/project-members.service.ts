import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { ProjectRole } from '@projectflow/shared';
import { ProjectMember, type ProjectMemberDocument } from './schemas/project-member.schema';

@Injectable()
export class ProjectMembersService {
  constructor(
    @InjectModel(ProjectMember.name)
    private readonly projectMemberModel: Model<ProjectMemberDocument>,
  ) {}

  async findRole(projectId: Types.ObjectId, userId: Types.ObjectId): Promise<ProjectRole | null> {
    const membership = await this.projectMemberModel
      .findOne({ projectId, userId })
      .select('role')
      .lean()
      .exec();
    return membership?.role ?? null;
  }

  findByProject(projectId: Types.ObjectId): Promise<ProjectMemberDocument[]> {
    return this.projectMemberModel.find({ projectId }).sort({ createdAt: 1 }).exec();
  }

  async findProjectIdsByUser(userId: Types.ObjectId): Promise<Types.ObjectId[]> {
    const memberships = await this.projectMemberModel
      .find({ userId })
      .select('projectId')
      .lean()
      .exec();
    return memberships.map((membership) => membership.projectId);
  }

  findExisting(
    projectId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ProjectMemberDocument | null> {
    return this.projectMemberModel.findOne({ projectId, userId }).exec();
  }

  add(
    projectId: Types.ObjectId,
    userId: Types.ObjectId,
    role: ProjectRole,
  ): Promise<ProjectMemberDocument> {
    return this.projectMemberModel.create({ projectId, userId, role });
  }

  /** Member counts for a batch of projects, keyed by project id. */
  async countByProjects(projectIds: Types.ObjectId[]): Promise<Map<string, number>> {
    if (projectIds.length === 0) {
      return new Map();
    }
    const rows = await this.projectMemberModel
      .aggregate<{
        _id: Types.ObjectId;
        count: number;
      }>([{ $match: { projectId: { $in: projectIds } } }, { $group: { _id: '$projectId', count: { $sum: 1 } } }])
      .exec();
    return new Map(rows.map((row) => [row._id.toString(), row.count]));
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { OrganizationRole } from '@projectflow/shared';
import {
  OrganizationMember,
  type OrganizationMemberDocument,
} from './schemas/organization-member.schema';

@Injectable()
export class OrganizationMembersService {
  constructor(
    @InjectModel(OrganizationMember.name)
    private readonly organizationMemberModel: Model<OrganizationMemberDocument>,
  ) {}

  async findRole(
    organizationId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<OrganizationRole | null> {
    const membership = await this.organizationMemberModel
      .findOne({ organizationId, userId })
      .select('role')
      .lean()
      .exec();
    return membership?.role ?? null;
  }

  findByUser(userId: Types.ObjectId): Promise<OrganizationMemberDocument[]> {
    return this.organizationMemberModel.find({ userId }).exec();
  }

  async findOrganizationIdsByUser(userId: Types.ObjectId): Promise<Types.ObjectId[]> {
    const memberships = await this.organizationMemberModel
      .find({ userId })
      .select('organizationId')
      .lean()
      .exec();
    return memberships.map((membership) => membership.organizationId);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { OrganizationRole, OrganizationSummary } from '@projectflow/shared';
import { OrganizationMembersService } from '../organization-members/organization-members.service';
import { Organization, type OrganizationDocument } from './schemas/organization.schema';

export type OrganizationWithRole = OrganizationSummary & { role: OrganizationRole };

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    private readonly organizationMembersService: OrganizationMembersService,
  ) {}

  async findById(organizationId: Types.ObjectId): Promise<OrganizationDocument> {
    const organization = await this.organizationModel.findById(organizationId).exec();
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization;
  }

  /** Organizations the user belongs to, along with the role they hold in each. */
  async findForUser(userId: Types.ObjectId): Promise<OrganizationWithRole[]> {
    const memberships = await this.organizationMembersService.findByUser(userId);
    if (memberships.length === 0) {
      return [];
    }

    const organizations = await this.organizationModel
      .find({ _id: { $in: memberships.map((membership) => membership.organizationId) } })
      .exec();

    const rolesByOrganizationId = new Map(
      memberships.map((membership) => [membership.organizationId.toString(), membership.role]),
    );

    return organizations.flatMap((organization) => {
      const role = rolesByOrganizationId.get(organization._id.toString());
      if (!role) {
        return [];
      }
      return [
        {
          id: organization._id.toString(),
          name: organization.name,
          slug: organization.slug,
          role,
        },
      ];
    });
  }
}

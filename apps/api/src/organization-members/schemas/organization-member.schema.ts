import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';
import { ORGANIZATION_ROLES, OrganizationRole } from '@projectflow/shared';

export type OrganizationMemberDocument = HydratedDocument<OrganizationMember>;

@Schema({ timestamps: true, collection: 'organization_members' })
export class OrganizationMember {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ORGANIZATION_ROLES, required: true })
  role: OrganizationRole;

  createdAt: Date;
  updatedAt: Date;
}

export const OrganizationMemberSchema = SchemaFactory.createForClass(OrganizationMember);

OrganizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

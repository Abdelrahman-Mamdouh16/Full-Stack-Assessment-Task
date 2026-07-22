import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';
import { PROJECT_ROLES, ProjectRole } from '@projectflow/shared';

export type ProjectMemberDocument = HydratedDocument<ProjectMember>;

@Schema({ timestamps: true, collection: 'project_members' })
export class ProjectMember {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: PROJECT_ROLES, required: true, default: ProjectRole.MEMBER })
  role: ProjectRole;

  createdAt: Date;
  updatedAt: Date;
}

export const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);

ProjectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

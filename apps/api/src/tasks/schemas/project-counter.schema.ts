import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type ProjectCounterDocument = HydratedDocument<ProjectCounter>;

@Schema({ collection: 'project_counters', timestamps: true })
export class ProjectCounter {
  @Prop({ type: SchemaTypes.ObjectId, required: true, unique: true, index: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 0 })
  seq!: number;
}

export const ProjectCounterSchema = SchemaFactory.createForClass(ProjectCounter);

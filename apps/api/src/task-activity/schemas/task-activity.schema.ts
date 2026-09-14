import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, SchemaTypes, Types } from 'mongoose';
import type { TaskActivityType } from '@projectflow/shared';

export type TaskActivityDocument = HydratedDocument<TaskActivity>;

export const TASK_ACTIVITY_TYPES: TaskActivityType[] = ['TASK_ASSIGNEE_CHANGED'];

@Schema({ collection: 'task_activities', timestamps: { createdAt: true, updatedAt: false } })
export class TaskActivity {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Task', required: true, index: true })
  taskId!: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Project', required: true, index: true })
  projectId!: Types.ObjectId;

  @Prop({ type: String, enum: TASK_ACTIVITY_TYPES, required: true })
  type!: TaskActivityType;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  actorId!: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  fromUserId?: Types.ObjectId | null;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  toUserId?: Types.ObjectId | null;

  createdAt!: Date;
}

export const TaskActivitySchema = SchemaFactory.createForClass(TaskActivity);

TaskActivitySchema.index({ taskId: 1, createdAt: -1 });

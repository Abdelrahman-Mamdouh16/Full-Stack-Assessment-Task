import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';
import { COMMENT_MAX_LENGTH } from '@projectflow/shared';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true, collection: 'comments' })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true, index: true })
  taskId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: COMMENT_MAX_LENGTH })
  content: string;

  createdAt: Date;
  updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ taskId: 1, createdAt: 1 });

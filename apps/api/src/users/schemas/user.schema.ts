import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ type: String, default: null })
  avatarUrl?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Defence in depth: the field is already excluded from queries by `select: false`.
UserSchema.set('toJSON', {
  virtuals: false,
  transform: (_doc, ret) => {
    Reflect.deleteProperty(ret, 'passwordHash');
    return ret;
  },
});

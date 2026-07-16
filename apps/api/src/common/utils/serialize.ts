import type { UserSummary } from '@projectflow/shared';
import type { Types } from 'mongoose';

export type IdLike = Types.ObjectId | string;

export function idToString(value: IdLike): string {
  return typeof value === 'string' ? value : value.toString();
}

interface UserLike {
  _id: IdLike;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

/** Projects a user document down to the fields the API is allowed to expose. */
export function toUserSummary(user: UserLike): UserSummary {
  return {
    id: idToString(user._id),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
  };
}

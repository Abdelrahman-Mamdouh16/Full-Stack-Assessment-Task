import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

/** Parses a route/body identifier, returning 400 rather than a cast error. */
export function toObjectId(value: string, field = 'id'): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new BadRequestException(`Invalid ${field}`);
  }
  return new Types.ObjectId(value);
}

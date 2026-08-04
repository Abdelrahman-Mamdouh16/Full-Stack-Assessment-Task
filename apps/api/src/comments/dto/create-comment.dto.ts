import { IsString, Length } from 'class-validator';
import { COMMENT_MAX_LENGTH } from '@projectflow/shared';

export class CreateCommentDto {
  @IsString()
  @Length(1, COMMENT_MAX_LENGTH)
  content: string;
}

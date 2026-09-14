import { IsMongoId, IsOptional, ValidateIf } from 'class-validator';

export class AssignTaskDto {
  @ValidateIf((_, value) => value !== null)
  @IsMongoId({ message: 'assigneeId must be a valid MongoDB ObjectId or null' })
  @IsOptional()
  assigneeId!: string | null;
}

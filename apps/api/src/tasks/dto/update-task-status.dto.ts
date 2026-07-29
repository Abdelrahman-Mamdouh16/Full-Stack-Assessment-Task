import { IsEnum } from 'class-validator';
import { TASK_STATUSES, TaskStatus } from '@projectflow/shared';

export class UpdateTaskStatusDto {
  @IsEnum(TASK_STATUSES)
  status: TaskStatus;
}

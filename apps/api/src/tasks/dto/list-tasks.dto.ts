import { IsEnum, IsOptional } from 'class-validator';
import { TASK_PRIORITIES, TASK_STATUSES, TaskPriority, TaskStatus } from '@projectflow/shared';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class ListTasksQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TASK_STATUSES)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TASK_PRIORITIES)
  priority?: TaskPriority;
}

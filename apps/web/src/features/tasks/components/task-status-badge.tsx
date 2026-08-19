import { TASK_STATUS_LABELS, TaskStatus } from '@projectflow/shared';
import { Badge, type BadgeProps } from '@/components/ui/badge';

const STATUS_TONES: Record<TaskStatus, NonNullable<BadgeProps['tone']>> = {
  [TaskStatus.TODO]: 'neutral',
  [TaskStatus.IN_PROGRESS]: 'info',
  [TaskStatus.IN_REVIEW]: 'warning',
  [TaskStatus.DONE]: 'success',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{TASK_STATUS_LABELS[status]}</Badge>;
}

import {
  ArrowDownIcon,
  ArrowUpIcon,
  EqualsIcon,
  WarningIcon,
} from '@phosphor-icons/react/dist/ssr';
import { TASK_PRIORITY_LABELS, TaskPriority } from '@projectflow/shared';
import { Badge, type BadgeProps } from '@/components/ui/badge';

const PRIORITY_TONES: Record<TaskPriority, NonNullable<BadgeProps['tone']>> = {
  [TaskPriority.LOW]: 'neutral',
  [TaskPriority.MEDIUM]: 'info',
  [TaskPriority.HIGH]: 'warning',
  [TaskPriority.URGENT]: 'danger',
};

const PRIORITY_ICONS = {
  [TaskPriority.LOW]: ArrowDownIcon,
  [TaskPriority.MEDIUM]: EqualsIcon,
  [TaskPriority.HIGH]: ArrowUpIcon,
  [TaskPriority.URGENT]: WarningIcon,
} as const;

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const PriorityIcon = PRIORITY_ICONS[priority];

  return (
    <Badge tone={PRIORITY_TONES[priority]}>
      <PriorityIcon size={11} weight="bold" />
      {TASK_PRIORITY_LABELS[priority]}
    </Badge>
  );
}

'use client';

import { toast } from 'sonner';
import { TASK_STATUS_LABELS, TASK_STATUS_ORDER, type TaskStatus } from '@projectflow/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateTaskStatus } from '../hooks';

interface TaskStatusSelectProps {
  taskId: string;
  projectId: string;
  status: TaskStatus;
}

export function TaskStatusSelect({ taskId, projectId, status }: TaskStatusSelectProps) {
  const updateStatus = useUpdateTaskStatus(taskId, projectId);

  return (
    <Select
      value={status}
      disabled={updateStatus.isPending}
      onValueChange={(value) =>
        updateStatus.mutate(value as TaskStatus, {
          onError: (error) => toast.error(error.message),
        })
      }
    >
      <SelectTrigger aria-label="Task status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TASK_STATUS_ORDER.map((option) => (
          <SelectItem key={option} value={option}>
            {TASK_STATUS_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

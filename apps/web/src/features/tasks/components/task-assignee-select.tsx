'use client';

import { UserCircleIcon, UsersThreeIcon } from '@phosphor-icons/react/dist/ssr';
import type { UserSummary } from '@projectflow/shared';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectMembers } from '@/features/projects/hooks';
import { useAssignTask } from '../hooks';

const UNASSIGNED_VALUE = '__unassigned__';

interface TaskAssigneeSelectProps {
  taskId: string;
  projectId: string;
  assignee: UserSummary | null;
}

export function TaskAssigneeSelect({ taskId, projectId, assignee }: TaskAssigneeSelectProps) {
  const members = useProjectMembers(projectId);
  const assignment = useAssignTask(taskId, projectId);

  if (members.isPending) {
    return <Skeleton className="h-8 w-full" />;
  }

  if (members.isError) {
    return (
      <div className="space-y-2">
        <p className="text-[12px] text-danger">{members.error.message}</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => members.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (members.data.length === 0) {
    return (
      <EmptyState
        icon={UsersThreeIcon}
        title="No project members"
        description="Add a project member before assigning this task."
        className="px-3 py-5"
      />
    );
  }

  const users = [
    ...(assignee && !members.data.some((member) => member.user.id === assignee.id)
      ? [assignee]
      : []),
    ...members.data.map((member) => member.user),
  ];
  const uniqueUsers = users.filter(
    (user, index, allUsers) =>
      allUsers.findIndex((candidate) => candidate.id === user.id) === index,
  );

  function handleValueChange(value: string) {
    const nextAssignee =
      value === UNASSIGNED_VALUE ? null : (uniqueUsers.find((user) => user.id === value) ?? null);

    if (nextAssignee?.id === assignee?.id || (!nextAssignee && !assignee)) {
      return;
    }

    assignment.mutate({
      assigneeId: nextAssignee?.id ?? null,
      assignee: nextAssignee,
    });
  }

  return (
    <div className="space-y-2">
      <Select
        value={assignee?.id ?? UNASSIGNED_VALUE}
        onValueChange={handleValueChange}
        disabled={assignment.isPending}
      >
        <SelectTrigger aria-label="Assignee">
          <SelectValue placeholder="Unassigned" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED_VALUE}>
            <span className="flex items-center gap-2">
              <UserCircleIcon size={15} className="text-subtle-foreground" />
              Unassigned
            </span>
          </SelectItem>
          {uniqueUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <span className="flex items-center gap-2">
                <Avatar user={user} size="sm" />
                {user.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {assignment.isError ? (
        <p role="alert" className="text-[12px] text-danger">
          {assignment.error.message}
        </p>
      ) : null}
    </div>
  );
}

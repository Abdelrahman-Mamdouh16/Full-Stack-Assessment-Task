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
import { useCurrentUser } from '@/features/auth/hooks';
import { useProject, useProjectMembers } from '@/features/projects/hooks';
import { useAssignTask } from '../hooks';

const UNASSIGNED_VALUE = '**unassigned**';

interface TaskAssigneeSelectProps {
  taskId: string;
  projectId: string;
  assignee: UserSummary | null;
}

export function TaskAssigneeSelect({ taskId, projectId, assignee }: TaskAssigneeSelectProps) {
  const currentUser = useCurrentUser();
  const project = useProject(projectId);
  const members = useProjectMembers(projectId);
  const assignment = useAssignTask(taskId, projectId);

  if (currentUser.isPending || project.isPending || members.isPending) {
    return <Skeleton className="h-8 w-full" />;
  }

  if (currentUser.isError) {
    return (
      <div className="space-y-2">
        {' '}
        <p className="text-[12px] text-danger">{currentUser.error.message}</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => currentUser.refetch()}>
          Try again{' '}
        </Button>{' '}
      </div>
    );
  }

  if (project.isError) {
    return (
      <div className="space-y-2">
        {' '}
        <p className="text-[12px] text-danger">{project.error.message}</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => project.refetch()}>
          Try again{' '}
        </Button>{' '}
      </div>
    );
  }

  if (members.isError) {
    return (
      <div className="space-y-2">
        {' '}
        <p className="text-[12px] text-danger">{members.error.message}</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => members.refetch()}>
          Try again{' '}
        </Button>{' '}
      </div>
    );
  }

  const user = currentUser.data;
  const projectData = project.data;
  const projectMembers = members.data;

  const projectMember = projectMembers.find((member) => member.user.id === user.id);

  const organizationMembership = user.organizations.find(
    (organization) => organization.id === projectData.organizationId,
  );

  const isOrganizationAdmin =
    organizationMembership?.role === 'OWNER' || organizationMembership?.role === 'ADMIN';

  const isProjectManager = projectMember?.role === 'PROJECT_MANAGER';
  const isProjectMember = Boolean(projectMember);

  const canAssignAnyone = isOrganizationAdmin || isProjectManager;
  const canAssignSelf = canAssignAnyone || isProjectMember;

  const isCurrentAssignee = assignee?.id === user.id;
  const canUnassign = canAssignAnyone || isCurrentAssignee;

  const assignableUsers = canAssignAnyone
    ? projectMembers.map((member) => member.user)
    : canAssignSelf
      ? [user]
      : [];

  const users = [
    ...(assignee && !assignableUsers.some((candidate) => candidate.id === assignee.id)
      ? [assignee]
      : []),
    ...assignableUsers,
  ];

  const uniqueUsers = users.filter(
    (candidate, index, allUsers) =>
      allUsers.findIndex((userCandidate) => userCandidate.id === candidate.id) === index,
  );

  const canChangeAssignee = canAssignSelf || canUnassign;

  function handleValueChange(value: string) {
    if (value === UNASSIGNED_VALUE) {
      if (!canUnassign) {
        return;
      }

      assignment.mutate({
        assigneeId: null,
        assignee: null,
      });

      return;
    }

    const nextAssignee = uniqueUsers.find((candidate) => candidate.id === value);

    if (!nextAssignee) {
      return;
    }

    if (!canAssignAnyone && nextAssignee.id !== user.id) {
      return;
    }

    if (nextAssignee.id === assignee?.id) {
      return;
    }

    assignment.mutate({
      assigneeId: nextAssignee.id,
      assignee: nextAssignee,
    });
  }

  if (projectMembers.length === 0) {
    return (
      <EmptyState
        icon={UsersThreeIcon}
        title="No project members"
        description="Add a project member before assigning this task."
        className="px-3 py-5"
      />
    );
  }

  return (
    <div className="space-y-2">
      <Select
        value={assignee?.id ?? UNASSIGNED_VALUE}
        onValueChange={handleValueChange}
        disabled={assignment.isPending || !canChangeAssignee}
      >
        {' '}
        <SelectTrigger aria-label="Assignee">
          {' '}
          <SelectValue placeholder="Unassigned" />{' '}
        </SelectTrigger>
        ```
        <SelectContent>
          {canUnassign ? (
            <SelectItem value={UNASSIGNED_VALUE}>
              <span className="flex items-center gap-2">
                <UserCircleIcon size={15} className="text-subtle-foreground" />
                Unassigned
              </span>
            </SelectItem>
          ) : null}

          {uniqueUsers.map((candidate) => {
            const isCurrentUser = candidate.id === user.id;
            const isCurrentAssigneeOption = candidate.id === assignee?.id;

            const disabled =
              (!canAssignAnyone && !isCurrentUser) || (isCurrentAssigneeOption && !isCurrentUser);

            return (
              <SelectItem key={candidate.id} value={candidate.id} disabled={disabled}>
                <span className="flex items-center gap-2">
                  <Avatar user={candidate} size="sm" />
                  {candidate.name}
                </span>
              </SelectItem>
            );
          })}
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

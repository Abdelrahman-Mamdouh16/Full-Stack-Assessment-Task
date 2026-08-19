'use client';

import { ListChecksIcon } from '@phosphor-icons/react/dist/ssr';
import { AvatarGroup } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTaskDialog } from '@/features/tasks/components/create-task-dialog';
import { TaskBoard } from '@/features/tasks/components/task-board';
import { useProjectTasks } from '@/features/tasks/hooks';
import { useProject, useProjectMembers } from '../hooks';

export function ProjectView({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const members = useProjectMembers(projectId);
  const tasks = useProjectTasks(projectId);

  if (project.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (project.isError) {
    return (
      <p className="rounded-md border border-danger/30 bg-danger-subtle px-3 py-2 text-[13px] text-danger">
        {project.error.message}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={project.data.organization.name}
        title={
          <span className="flex items-center gap-2">
            {project.data.name}
            <Badge tone="primary">{project.data.key}</Badge>
          </span>
        }
        description={project.data.description ?? undefined}
        actions={
          <>
            {members.data && members.data.length > 0 ? (
              <AvatarGroup users={members.data.map((member) => member.user)} />
            ) : null}
            <CreateTaskDialog projectId={projectId} />
          </>
        }
      />

      {tasks.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : tasks.isError ? (
        <p className="rounded-md border border-danger/30 bg-danger-subtle px-3 py-2 text-[13px] text-danger">
          {tasks.error.message}
        </p>
      ) : tasks.data.items.length === 0 ? (
        <EmptyState
          icon={ListChecksIcon}
          title="No tasks yet"
          description="Create the first task to start tracking work on this project."
        />
      ) : (
        <TaskBoard tasks={tasks.data.items} projectId={projectId} />
      )}
    </div>
  );
}

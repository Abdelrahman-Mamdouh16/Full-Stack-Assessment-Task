'use client';

import { ClockCounterClockwiseIcon } from '@phosphor-icons/react/dist/ssr';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/format';
import { useTaskActivity } from '../hooks';

interface TaskActivityTimelineProps {
  taskId: string;
}

export function TaskActivityTimeline({ taskId }: TaskActivityTimelineProps) {
  const activity = useTaskActivity(taskId);

  return (
    <section className="space-y-4" aria-label="Activity history">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">Activity</h2>
        {activity.data ? (
          <span className="rounded-sm bg-surface-strong px-1.5 text-[11px] text-muted-foreground">
            {activity.data.total}
          </span>
        ) : null}
      </div>

      {activity.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : activity.isError ? (
        <p
          role="alert"
          className="rounded-md border border-danger/30 bg-danger-subtle px-3 py-2 text-[13px] text-danger"
        >
          {activity.error.message}
        </p>
      ) : activity.data.items.length === 0 ? (
        <EmptyState
          icon={ClockCounterClockwiseIcon}
          title="No activity yet"
          description="Assignment changes will appear here."
        />
      ) : (
        <ol className="divide-y divide-border border-y border-border">
          {activity.data.items.map((entry) => (
            <li key={entry.id} className="flex gap-3 py-3">
              <Avatar user={entry.actor} size="md" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[13px] font-medium text-foreground">
                    {entry.actor.name}
                  </span>
                  <span className="text-[12px] text-subtle-foreground">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </div>
                <p className="text-[13px] text-muted-foreground">Changed the assignee</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
                  <span className="text-subtle-foreground">From</span>
                  <ActivityUser user={entry.metadata.from} />
                  <span className="text-subtle-foreground">to</span>
                  <ActivityUser user={entry.metadata.to} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ActivityUser({ user }: { user: Parameters<typeof Avatar>[0]['user'] | null }) {
  return user ? (
    <span className="font-medium text-foreground">{user.name}</span>
  ) : (
    <span className="italic text-subtle-foreground">Unassigned</span>
  );
}

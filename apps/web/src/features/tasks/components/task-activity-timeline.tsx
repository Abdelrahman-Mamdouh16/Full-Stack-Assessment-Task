'use client';

import { ClockCounterClockwiseIcon } from '@phosphor-icons/react/dist/ssr';
import type { TaskActivityEntry } from '@projectflow/shared';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/format';
import { useTaskActivity } from '../hooks';

interface TaskActivityTimelineProps {
  taskId: string;
}

/**
 * Renders one TASK_ASSIGNEE_CHANGED entry as a plain-language sentence,
 * matching the brief's example phrasing exactly:
 *   'Ammar assigned Magd'
 *   'Magd changed the assignee from themselves to Ahmed'
 *   'Ahmed removed the assignee'
 * Each transition type (assign / reassign / unassign) gets its own
 * sentence shape instead of one generic 'Changed the assignee' label.
 */
function describeActivity(entry: TaskActivityEntry): string {
  const actorName = entry.actor.name;
  const { from, to } = entry.metadata;

  const nameOrThemselves = (user: typeof from) =>
    user && user.id === entry.actor.id ? 'themselves' : (user?.name ?? 'someone');

  if (from === null && to !== null) {
    return to.id === entry.actor.id
      ? `${actorName} assigned themselves`
      : `${actorName} assigned ${to.name}`;
  }

  if (from !== null && to !== null) {
    return `${actorName} changed the assignee from ${nameOrThemselves(from)} to ${nameOrThemselves(to)}`;
  }

  // from !== null && to === null (or the from === null && to === null edge case, which
  // shouldn't be recorded by the backend at all since it isn't a real transition).
  return `${actorName} removed the assignee`;
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
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
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
        <ul className="space-y-3">
          {activity.data.items.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3">
              <Avatar user={entry.actor} size="sm" />
              <p className="min-w-0 flex-1 text-[13px] text-muted-foreground">
                <span className="text-foreground">{describeActivity(entry)}</span>
                {' \u2014 '}
                <span className="text-subtle-foreground">
                  {formatRelativeTime(entry.createdAt)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

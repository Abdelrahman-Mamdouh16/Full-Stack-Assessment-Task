import { TASK_STATUS_LABELS, TASK_STATUS_ORDER, type TaskSummary } from '@projectflow/shared';
import { TaskRow } from './task-row';

interface TaskBoardProps {
  tasks: TaskSummary[];
  projectId: string;
}

/** Tasks grouped into one section per status, in workflow order. */
export function TaskBoard({ tasks, projectId }: TaskBoardProps) {
  return (
    <div className="space-y-6">
      {TASK_STATUS_ORDER.map((status) => {
        const tasksInStatus = tasks.filter((task) => task.status === status);

        return (
          <section key={status} aria-labelledby={`status-${status}`}>
            <div className="mb-2 flex items-center gap-2">
              <h2
                id={`status-${status}`}
                className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {TASK_STATUS_LABELS[status]}
              </h2>
              <span className="rounded-sm bg-surface-strong px-1.5 text-[11px] text-muted-foreground">
                {tasksInStatus.length}
              </span>
            </div>

            {tasksInStatus.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-4 text-[13px] text-subtle-foreground">
                Nothing here.
              </p>
            ) : (
              <div className="overflow-hidden rounded-md border border-border bg-surface">
                {tasksInStatus.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    href={`/projects/${projectId}/tasks/${task.id}`}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

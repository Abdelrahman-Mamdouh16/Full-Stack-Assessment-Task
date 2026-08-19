import Link from 'next/link';
import { ChatCircleIcon } from '@phosphor-icons/react/dist/ssr';
import type { TaskSummary } from '@projectflow/shared';
import { Avatar } from '@/components/ui/avatar';
import { TaskPriorityBadge } from './task-priority-badge';

interface TaskRowProps {
  task: TaskSummary;
  href: string;
}

export function TaskRow({ task, href }: TaskRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0 hover:bg-surface-strong"
    >
      <span className="w-16 shrink-0 font-mono text-[12px] text-muted-foreground">{task.key}</span>

      <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">{task.title}</span>

      {task.commentCount > 0 ? (
        <span className="hidden shrink-0 items-center gap-1 text-[12px] text-subtle-foreground sm:inline-flex">
          <ChatCircleIcon size={13} />
          {task.commentCount}
        </span>
      ) : null}

      <span className="hidden shrink-0 sm:block">
        <TaskPriorityBadge priority={task.priority} />
      </span>

      <Avatar user={task.createdBy} size="sm" />
    </Link>
  );
}

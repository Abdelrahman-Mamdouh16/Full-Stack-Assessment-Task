'use client';

import { ChatCircleIcon } from '@phosphor-icons/react/dist/ssr';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/format';
import { useTaskComments } from '../hooks';
import { CommentForm } from './comment-form';

export function CommentList({ taskId }: { taskId: string }) {
  const { data, isPending, isError, error } = useTaskComments(taskId);

  return (
    <section className="space-y-4" aria-label="Comments">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">Comments</h2>
        {data ? (
          <span className="rounded-sm bg-surface-strong px-1.5 text-[11px] text-muted-foreground">
            {data.total}
          </span>
        ) : null}
      </div>

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : isError ? (
        <p className="rounded-md border border-danger/30 bg-danger-subtle px-3 py-2 text-[13px] text-danger">
          {error.message}
        </p>
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={ChatCircleIcon}
          title="No comments yet"
          description="Start the discussion by leaving the first comment."
        />
      ) : (
        <ul className="space-y-4">
          {data.items.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Avatar user={comment.author} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[13px] font-medium text-foreground">
                    {comment.author.name}
                  </span>
                  <span className="text-[12px] text-subtle-foreground">
                    {formatDateTime(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-5 text-muted-foreground">
                  {comment.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CommentForm taskId={taskId} />
    </section>
  );
}

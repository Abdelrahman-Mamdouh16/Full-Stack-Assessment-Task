'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { COMMENT_MAX_LENGTH } from '@projectflow/shared';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateComment } from '../hooks';

export function CommentForm({ taskId }: { taskId: string }) {
  const [content, setContent] = useState('');
  const createComment = useCreateComment(taskId);

  const trimmed = content.trim();
  const isTooLong = trimmed.length > COMMENT_MAX_LENGTH;

  return (
    <form
      className="space-y-2 border-t border-border pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (trimmed.length === 0 || isTooLong) {
          return;
        }
        createComment.mutate(trimmed, {
          onSuccess: () => setContent(''),
          onError: (error) => toast.error(error.message),
        });
      }}
    >
      <label htmlFor="new-comment" className="sr-only">
        Add a comment
      </label>
      <Textarea
        id="new-comment"
        rows={3}
        placeholder="Add a comment…"
        value={content}
        aria-invalid={isTooLong}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-subtle-foreground">
          {isTooLong ? `${trimmed.length} / ${COMMENT_MAX_LENGTH} characters` : ''}
        </span>
        <Button
          type="submit"
          size="sm"
          loading={createComment.isPending}
          disabled={trimmed.length === 0 || isTooLong}
        >
          Comment
        </Button>
      </div>
    </form>
  );
}

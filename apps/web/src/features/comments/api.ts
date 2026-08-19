import type { CommentEntry, Paginated } from '@projectflow/shared';
import { apiRequest } from '@/lib/api-client';

const COMMENTS_PAGE_SIZE = 50;

export function fetchTaskComments(taskId: string): Promise<Paginated<CommentEntry>> {
  return apiRequest<Paginated<CommentEntry>>(`/tasks/${taskId}/comments`, {
    query: { page: 1, pageSize: COMMENTS_PAGE_SIZE },
  });
}

export function createComment(taskId: string, content: string): Promise<CommentEntry> {
  return apiRequest<CommentEntry>(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: { content },
  });
}

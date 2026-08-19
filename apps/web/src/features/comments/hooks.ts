'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommentEntry, Paginated } from '@projectflow/shared';
import { queryKeys } from '@/lib/query-keys';
import { createComment, fetchTaskComments } from './api';

export function useTaskComments(taskId: string) {
  return useQuery<Paginated<CommentEntry>>({
    queryKey: queryKeys.taskComments(taskId),
    queryFn: () => fetchTaskComments(taskId),
    enabled: taskId.length > 0,
  });
}

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation<CommentEntry, Error, string>({
    mutationFn: (content) => createComment(taskId, content),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.taskComments(taskId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) }),
      ]);
    },
  });
}

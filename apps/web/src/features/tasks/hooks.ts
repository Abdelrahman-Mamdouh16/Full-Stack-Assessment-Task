'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Paginated,
  TaskActivityEntry,
  TaskDetail,
  TaskStatus,
  TaskSummary,
  UserSummary,
} from '@projectflow/shared';
import { queryKeys } from '@/lib/query-keys';
import {
  createTask,
  assignTask,
  type CreateTaskPayload,
  fetchProjectTasks,
  fetchTask,
  fetchTaskActivity,
  updateTaskStatus,
} from './api';

interface AssignTaskVariables {
  assigneeId: string | null;
  assignee: UserSummary | null;
}

interface AssignTaskContext {
  previousTask: TaskDetail | undefined;
  previousProjectTasks: Paginated<TaskSummary> | undefined;
}

export function useProjectTasks(projectId: string) {
  return useQuery<Paginated<TaskSummary>>({
    queryKey: queryKeys.projectTasks(projectId),
    queryFn: () => fetchProjectTasks(projectId),
    enabled: projectId.length > 0,
  });
}

export function useTask(taskId: string) {
  return useQuery<TaskDetail>({
    queryKey: queryKeys.task(taskId),
    queryFn: () => fetchTask(taskId),
    enabled: taskId.length > 0,
  });
}

export function useTaskActivity(taskId: string) {
  return useQuery<Paginated<TaskActivityEntry>>({
    queryKey: queryKeys.taskActivity(taskId),
    queryFn: () => fetchTaskActivity(taskId),
    enabled: taskId.length > 0,
  });
}

export function useAssignTask(taskId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<TaskDetail, Error, AssignTaskVariables, AssignTaskContext>({
    mutationFn: ({ assigneeId }) => assignTask(taskId, assigneeId),
    onMutate: async ({ assignee }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.task(taskId) }),
        queryClient.cancelQueries({ queryKey: queryKeys.projectTasks(projectId) }),
      ]);

      const previousTask = queryClient.getQueryData<TaskDetail>(queryKeys.task(taskId));
      const previousProjectTasks = queryClient.getQueryData<Paginated<TaskSummary>>(
        queryKeys.projectTasks(projectId),
      );

      if (previousTask) {
        queryClient.setQueryData<TaskDetail>(queryKeys.task(taskId), {
          ...previousTask,
          assignee,
        });
      }

      if (previousProjectTasks) {
        queryClient.setQueryData<Paginated<TaskSummary>>(queryKeys.projectTasks(projectId), {
          ...previousProjectTasks,
          items: previousProjectTasks.items.map((task) =>
            task.id === taskId ? { ...task, assignee } : task,
          ),
        });
      }

      return { previousTask, previousProjectTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(queryKeys.task(taskId), context.previousTask);
      }
      if (context?.previousProjectTasks) {
        queryClient.setQueryData(queryKeys.projectTasks(projectId), context.previousProjectTasks);
      }
    },
    onSuccess: async (task) => {
      queryClient.setQueryData(queryKeys.task(taskId), task);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.taskActivity(taskId) }),
      ]);
    },
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<TaskDetail, Error, CreateTaskPayload>({
    mutationFn: (payload) => createTask(projectId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
      ]);
    },
  });
}

export function useUpdateTaskStatus(taskId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<TaskDetail, Error, TaskStatus>({
    mutationFn: (status) => updateTaskStatus(taskId, status),
    onSuccess: async (task) => {
      queryClient.setQueryData(queryKeys.task(taskId), task);
      await queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) });
    },
  });
}

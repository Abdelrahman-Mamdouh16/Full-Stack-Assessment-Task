'use client';

import { useQuery } from '@tanstack/react-query';
import type { ProjectDetail, ProjectMemberEntry, ProjectSummary } from '@projectflow/shared';
import { queryKeys } from '@/lib/query-keys';
import { fetchProject, fetchProjectMembers, fetchProjects } from './api';

export function useProjects() {
  return useQuery<ProjectSummary[]>({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
  });
}

export function useProject(projectId: string) {
  return useQuery<ProjectDetail>({
    queryKey: queryKeys.project(projectId),
    queryFn: () => fetchProject(projectId),
    enabled: projectId.length > 0,
  });
}

export function useProjectMembers(projectId: string) {
  return useQuery<ProjectMemberEntry[]>({
    queryKey: queryKeys.projectMembers(projectId),
    queryFn: () => fetchProjectMembers(projectId),
    enabled: projectId.length > 0,
  });
}

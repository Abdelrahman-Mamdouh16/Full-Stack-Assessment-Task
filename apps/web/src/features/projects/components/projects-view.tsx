'use client';

import { FolderOpenIcon } from '@phosphor-icons/react/dist/ssr';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { useProjects } from '../hooks';
import { ProjectCard } from './project-card';
import { ProjectCardSkeleton } from './project-card-skeleton';

export function ProjectsView() {
  const { data: projects, isPending, isError, error } = useProjects();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Every project you have access to across your organization."
      />

      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      ) : isError ? (
        <p className="rounded-md border border-danger/30 bg-danger-subtle px-3 py-2 text-[13px] text-danger">
          {error.message}
        </p>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderOpenIcon}
          title="No projects yet"
          description="Once you are added to a project it will show up here."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import { CheckSquareIcon, UsersThreeIcon } from '@phosphor-icons/react/dist/ssr';
import type { ProjectSummary } from '@projectflow/shared';
import { Badge } from '@/components/ui/badge';

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
          {project.name}
        </h2>
        <Badge tone="primary">{project.key}</Badge>
      </div>

      <p className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-5 text-muted-foreground">
        {project.description ?? 'No description yet.'}
      </p>

      <div className="flex items-center gap-4 border-t border-border pt-3 text-[12px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <UsersThreeIcon size={14} />
          {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckSquareIcon size={14} />
          {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}
        </span>
      </div>
    </Link>
  );
}

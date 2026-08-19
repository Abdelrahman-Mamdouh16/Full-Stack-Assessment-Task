'use client';

import Link from 'next/link';
import type { ProjectSummary } from '@projectflow/shared';
import { cn } from '@/lib/utils';

interface SidebarProjectItemProps {
  project: ProjectSummary;
  active: boolean;
  onNavigate?: () => void;
}

export function SidebarProjectItem({ project, active, onNavigate }: SidebarProjectItemProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors',
        active
          ? 'bg-surface-strong font-medium text-foreground'
          : 'text-muted-foreground hover:bg-surface-strong hover:text-foreground',
      )}
    >
      <span className="w-9 shrink-0 font-mono text-[11px] text-subtle-foreground">
        {project.key}
      </span>
      <span className="truncate">{project.name}</span>
    </Link>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FolderIcon } from '@phosphor-icons/react/dist/ssr';
import type { CurrentUser, ProjectSummary } from '@projectflow/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { SidebarProjectItem } from './sidebar-project-item';
import { UserMenu } from './user-menu';

interface SidebarProps {
  user: CurrentUser;
  projects: ProjectSummary[] | undefined;
  isLoadingProjects: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ user, projects, isLoadingProjects, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const organization = user.organizations[0];

  return (
    <div className="flex h-full flex-col gap-4 bg-surface p-3">
      <div className="px-2 pt-1">
        <Logo />
        {organization ? (
          <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">
            {organization.name}
          </p>
        ) : null}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto" aria-label="Main">
        <Link
          href="/projects"
          onClick={onNavigate}
          aria-current={pathname === '/projects' ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors',
            pathname === '/projects'
              ? 'bg-surface-strong font-medium text-foreground'
              : 'text-muted-foreground hover:bg-surface-strong hover:text-foreground',
          )}
        >
          <FolderIcon size={15} />
          All projects
        </Link>

        <div>
          <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">
            Projects
          </p>

          {isLoadingProjects ? (
            <div className="space-y-1.5 px-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          ) : projects && projects.length > 0 ? (
            <ul className="space-y-0.5">
              {projects.map((project) => (
                <li key={project.id}>
                  <SidebarProjectItem
                    project={project}
                    active={pathname.startsWith(`/projects/${project.id}`)}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 text-[12px] text-subtle-foreground">No projects yet.</p>
          )}
        </div>
      </nav>

      <div className="border-t border-border pt-2">
        <UserMenu user={user} />
      </div>
    </div>
  );
}

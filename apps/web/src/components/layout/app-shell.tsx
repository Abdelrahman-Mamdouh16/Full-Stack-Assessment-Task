'use client';

import { ListIcon } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useCurrentUser } from '@/features/auth/hooks';
import { useProjects } from '@/features/projects/hooks';
import { getAccessToken } from '@/lib/auth-storage';
import { Logo } from './logo';
import { Sidebar } from './sidebar';

/**
 * Authenticated application frame: a persistent sidebar on desktop and a
 * drawer on small screens. Redirects to the login page when there is no valid
 * session.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: user, isPending, isError } = useCurrentUser();
  const { data: projects, isPending: isLoadingProjects } = useProjects();

  useEffect(() => {
    if (isError || (!isPending && !user) || (typeof window !== 'undefined' && !getAccessToken())) {
      router.replace('/login');
    }
  }, [isError, isPending, user, router]);

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="text-[13px] text-muted-foreground">Loading workspace…</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
        <div className="sticky top-0 h-dvh">
          <Sidebar user={user} projects={projects} isLoadingProjects={isLoadingProjects} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
          <DialogPrimitive.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DialogPrimitive.Trigger
              aria-label="Open navigation"
              className="rounded-md p-1 text-muted-foreground hover:bg-surface-strong hover:text-foreground"
            >
              <ListIcon size={18} />
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40" />
              <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-surface focus:outline-none">
                <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
                <Sidebar
                  user={user}
                  projects={projects}
                  isLoadingProjects={isLoadingProjects}
                  onNavigate={() => setDrawerOpen(false)}
                />
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>

          <Logo />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

'use client';

import { CaretUpDownIcon, SignOutIcon } from '@phosphor-icons/react/dist/ssr';
import type { CurrentUser } from '@projectflow/shared';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/features/auth/hooks';

export function UserMenu({ user }: { user: CurrentUser }) {
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-strong">
        <Avatar user={user} size="md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-foreground">
            {user.name}
          </span>
          <span className="block truncate text-[11px] text-subtle-foreground">{user.email}</span>
        </span>
        <CaretUpDownIcon size={13} className="shrink-0 text-subtle-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Signed in as {user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>
          <SignOutIcon size={14} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

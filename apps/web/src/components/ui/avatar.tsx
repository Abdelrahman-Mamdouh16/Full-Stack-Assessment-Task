'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import type { UserSummary } from '@projectflow/shared';
import { cn } from '@/lib/utils';
import { initialsOf } from '@/lib/format';

const SIZES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-7 w-7 text-[11px]',
  lg: 'h-9 w-9 text-[13px]',
} as const;

interface AvatarProps {
  user: Pick<UserSummary, 'name' | 'avatarUrl'>;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ user, size = 'md', className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-border bg-surface-strong',
        SIZES[size],
        className,
      )}
    >
      {user.avatarUrl ? (
        <AvatarPrimitive.Image
          src={user.avatarUrl}
          alt={user.name}
          className="h-full w-full object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback className="font-medium text-muted-foreground" delayMs={0}>
        {initialsOf(user.name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

interface AvatarGroupProps {
  users: Array<Pick<UserSummary, 'name' | 'avatarUrl'>>;
  max?: number;
  size?: keyof typeof SIZES;
}

export function AvatarGroup({ users, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - visible.length;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((user, index) => (
        <Avatar
          key={`${user.name}-${index}`}
          user={user}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full border border-border bg-surface-strong font-medium text-muted-foreground ring-2 ring-background',
            SIZES[size],
          )}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('animate-shimmer rounded-md bg-surface-strong', className)} />
  );
}

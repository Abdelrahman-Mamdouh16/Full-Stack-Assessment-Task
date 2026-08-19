import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium leading-4',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-surface-strong text-muted-foreground',
        info: 'border-transparent bg-info-subtle text-info',
        warning: 'border-transparent bg-warning-subtle text-warning',
        success: 'border-transparent bg-success-subtle text-success',
        danger: 'border-transparent bg-danger-subtle text-danger',
        primary: 'border-transparent bg-primary-subtle text-primary',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };

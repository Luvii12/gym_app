import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'accent' | 'accent-outline' | 'neutral' | 'success' | 'rest' | 'danger';

const variants: Record<Variant, string> = {
  accent: 'bg-accent text-on-accent',
  'accent-outline': 'border border-accent text-accent',
  neutral: 'bg-surface-container-high text-muted',
  success: 'border border-success/40 bg-success/10 text-success',
  rest: 'border border-rest/40 bg-rest/10 text-rest',
  danger: 'border border-danger/40 bg-error-container/40 text-danger',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ variant = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-label-sm uppercase',
        variants[variant],
        className,
      )}
      {...rest}
    />
  );
}

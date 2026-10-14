import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type Size = 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent font-bold',
  secondary: 'bg-surface-container-high text-on-surface border border-surface-container-highest',
  outline: 'border border-accent text-accent bg-transparent',
  danger: 'bg-error-container text-on-error-container',
  ghost: 'text-on-surface hover:bg-surface-container-high',
};

const sizes: Record<Size, string> = {
  md: 'min-h-12 px-4 text-label-lg',
  lg: 'min-h-13 px-5 text-headline-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  pill?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  pill = false,
  fullWidth = false,
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 font-semibold select-none',
        'transition-transform duration-150 active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-40',
        pill ? 'rounded-full' : 'rounded-md',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    />
  );
}

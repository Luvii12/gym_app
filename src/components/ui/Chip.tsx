import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> {
  selected: boolean;
}

/** Botón de filtro (alternable). `selected` se expone como `aria-pressed`. */
export function Chip({ selected, type = 'button', className, ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'h-11 shrink-0 cursor-pointer rounded-md px-4 text-label-lg select-none',
        'transition-transform duration-150 active:scale-95',
        selected
          ? 'bg-accent font-bold text-on-accent'
          : 'border border-surface-container-high bg-surface-container-low text-muted',
        className,
      )}
      {...rest}
    />
  );
}

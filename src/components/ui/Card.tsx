import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/** Niveles de DESIGN.md: 1 = tarjeta estructural, 2 = módulo activo, 3 = superposición. */
type Elevation = 1 | 2 | 3;

const levels: Record<Elevation, string> = {
  1: 'bg-surface-container-low border-surface-container-high',
  2: 'bg-surface-container border-surface-container-highest',
  3: 'bg-surface-container-low border-accent/15',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: Elevation;
  /** Borde lima: marca la tarjeta activa (p. ej. la rutina activa). */
  accent?: boolean;
}

export function Card({ elevation = 1, accent = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border',
        accent ? 'border-accent/70 bg-surface-container-low' : levels[elevation],
        elevation === 3 && 'shadow-overlay',
        className,
      )}
      {...rest}
    />
  );
}

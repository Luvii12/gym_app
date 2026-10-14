import { cn } from '../../lib/cn';

export interface ProgressBarProps {
  value: number;
  max: number;
  /** Texto accesible: qué progresa ("Progreso general"). */
  label: string;
  /** `rest` es el degradado naranja → lima del temporizador de descanso. */
  tone?: 'accent' | 'rest';
  className?: string;
}

export function ProgressBar({ value, max, label, tone = 'accent', className }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const clamped = Math.min(safeMax, Math.max(0, value));
  const percent = (clamped / safeMax) * 100;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clamped}
      className={cn(
        'h-1 w-full overflow-hidden rounded-full bg-surface-container-highest',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300 ease-linear',
          tone === 'accent' ? 'bg-accent' : 'bg-linear-to-r from-rest to-accent',
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

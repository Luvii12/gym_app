import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatNumber, stepValue } from '../../lib/number';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Nombre de lo que se ajusta ("peso", "repeticiones"): se usa en los textos accesibles. */
  label: string;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  /** Texto del valor (por defecto, número en español). */
  format?: (value: number) => string;
  /** Versión estrecha (botones de 44 px) para filas de varias columnas. */
  compact?: boolean;
  className?: string;
}

const stepButton =
  'grid shrink-0 cursor-pointer place-items-center rounded-md border ' +
  'border-surface-container-highest bg-surface-container-high text-primary ' +
  'transition-transform duration-150 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40';

export function Stepper({
  value,
  onChange,
  label,
  step = 1,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  unit,
  format = formatNumber,
  compact = false,
  className,
}: StepperProps) {
  const set = (delta: number) => onChange(stepValue(value, delta, { min, max }));

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'flex items-center rounded-lg bg-surface-container-lowest',
        compact ? 'gap-0.5 p-0.5' : 'gap-1 p-1',
        className,
      )}
    >
      <button
        type="button"
        className={cn(stepButton, compact ? 'size-11' : 'size-12')}
        aria-label={`Reducir ${label}`}
        disabled={value <= min}
        onClick={() => set(-step)}
      >
        <Minus aria-hidden size={20} />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <span className={cn('tabular-nums', compact ? 'text-headline-sm' : 'text-headline-md')}>
          {format(value)}
        </span>
        {unit && <span className="ml-1 text-body-sm text-muted">{unit}</span>}
      </div>
      <button
        type="button"
        className={cn(stepButton, compact ? 'size-11' : 'size-12')}
        aria-label={`Aumentar ${label}`}
        disabled={value >= max}
        onClick={() => set(step)}
      >
        <Plus aria-hidden size={20} />
      </button>
    </div>
  );
}

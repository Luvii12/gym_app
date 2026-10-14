import { Check } from 'lucide-react';
import { Stepper } from '../../components/ui';
import {
  WEIGHT_STEP_KG,
  formatRepRange,
  type LastPerformance,
  type LoggedSet,
  type SessionTarget,
} from '../../domain';
import { cn } from '../../lib/cn';
import { formatNumber } from '../../lib/number';

export interface SetRowProps {
  exerciseName: string;
  set: LoggedSet;
  /** Es la primera serie sin hacer del ejercicio: lleva el número resaltado. */
  isCurrent: boolean;
  target: SessionTarget;
  last?: LastPerformance;
  onChange: (changes: { weightKg?: number; reps?: number }) => void;
  onToggle: () => void;
}

export function SetRow({
  exerciseName,
  set,
  isCurrent,
  target,
  last,
  onChange,
  onToggle,
}: SetRowProps) {
  const done = set.completedAt !== undefined;
  const number = set.setIndex + 1;

  return (
    <li
      className={cn(
        'border-t border-surface-container-high px-3 py-3',
        isCurrent && 'bg-surface-container',
      )}
    >
      <div className="grid grid-cols-[1.75rem_1fr_1fr_2.75rem] items-center gap-2">
        <span
          className={cn(
            'grid size-7 place-items-center rounded-sm text-label-lg tabular-nums',
            isCurrent ? 'bg-accent text-on-accent' : 'bg-surface-container-high text-muted',
          )}
        >
          {number}
        </span>
        {done ? (
          <>
            <p className="text-center text-headline-sm text-muted tabular-nums line-through">
              {formatNumber(set.weightKg)} <span className="text-body-sm">kg</span>
            </p>
            <p className="text-center text-headline-sm text-muted tabular-nums line-through">
              {set.reps}
            </p>
          </>
        ) : (
          <>
            <Stepper
              compact
              label={`peso de la serie ${number} de ${exerciseName}`}
              value={set.weightKg}
              step={WEIGHT_STEP_KG}
              max={999}
              onChange={(weightKg) => onChange({ weightKg })}
            />
            <Stepper
              compact
              label={`repeticiones de la serie ${number} de ${exerciseName}`}
              value={set.reps}
              onChange={(reps) => onChange({ reps })}
            />
          </>
        )}
        <button
          type="button"
          aria-pressed={done}
          aria-label={
            done
              ? `Desmarcar serie ${number} de ${exerciseName}`
              : `Completar serie ${number} de ${exerciseName}`
          }
          onClick={onToggle}
          className={cn(
            'grid size-11 cursor-pointer place-items-center rounded-md border-2 transition-transform active:scale-95',
            done ? 'border-success/60 bg-success/20 text-success' : 'border-accent text-accent',
          )}
        >
          <Check aria-hidden size={24} />
        </button>
      </div>
      {!done && (
        <div className="mt-1 grid grid-cols-[1.75rem_1fr_1fr_2.75rem] gap-2 text-center text-body-sm text-muted">
          <span />
          <span>
            {last
              ? `Última vez: ${formatNumber(last.weightKg)} kg × ${last.reps}`
              : 'Sin historial'}
          </span>
          <span>Objetivo: {formatRepRange(target.repsMin, target.repsMax)}</span>
          <span />
        </div>
      )}
    </li>
  );
}

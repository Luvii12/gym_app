import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Card, Stepper } from '../../components/ui';
import {
  REPS_MAX,
  REPS_MIN,
  REST_MAX_SEC,
  REST_MIN_SEC,
  REST_STEP_SEC,
  SETS_MAX,
  SETS_MIN,
  formatRest,
  validateRepRange,
  type RoutineItem,
} from '../../domain';
import { cn } from '../../lib/cn';

export interface RoutineItemCardProps {
  item: RoutineItem;
  /** `null` si el ejercicio ya no existe en el catálogo. */
  name: string | null;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (changes: Partial<Omit<RoutineItem, 'exerciseId'>>) => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
}

const iconButton =
  'grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-muted ' +
  'active:text-accent disabled:pointer-events-none disabled:opacity-40';

const repsInput =
  'h-11 w-full min-w-0 rounded-md border bg-surface-container-lowest px-3 text-center ' +
  'text-body-lg text-on-surface tabular-nums focus:outline-none';

function RepRange({
  name,
  repsMin,
  repsMax,
  onCommit,
}: {
  name: string;
  repsMin: number;
  repsMax: number;
  onCommit: (repsMin: number, repsMax: number) => void;
}) {
  // Borrador de texto mientras se escribe; `null` = se muestran los valores guardados.
  const [draft, setDraft] = useState<{ min: string; max: string } | null>(null);
  const min = draft?.min ?? String(repsMin);
  const max = draft?.max ?? String(repsMax);
  const error = draft ? validateRepRange(Number(draft.min || NaN), Number(draft.max || NaN)) : null;

  function edit(next: { min: string; max: string }) {
    setDraft(next);
    const lo = Number(next.min || NaN);
    const hi = Number(next.max || NaN);
    if (validateRepRange(lo, hi) === null && (lo !== repsMin || hi !== repsMax)) onCommit(lo, hi);
  }

  const field = (label: string, value: string, key: 'min' | 'max') => (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-body-sm text-muted">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={3}
        aria-label={`Repeticiones ${label.toLowerCase()} de ${name}`}
        aria-invalid={error ? true : undefined}
        value={value}
        onChange={(event) =>
          edit({ min, max, [key]: event.target.value.replace(/\D/g, '') } as {
            min: string;
            max: string;
          })
        }
        onBlur={() => setDraft(null)}
        className={cn(
          repsInput,
          error ? 'border-danger' : 'border-surface-container-high focus:border-accent',
        )}
      />
    </label>
  );

  return (
    <div>
      <div className="flex items-end gap-2">
        {field('Mínimo', min, 'min')}
        <span aria-hidden className="pb-2.5 text-muted">
          –
        </span>
        {field('Máximo', max, 'max')}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-body-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function RoutineItemCard({
  item,
  name,
  position,
  isFirst,
  isLast,
  onChange,
  onMove,
  onRemove,
}: RoutineItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.exerciseId });
  const label = name ?? 'Ejercicio eliminado';

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10')}
    >
      <Card elevation={1} className={cn('flex flex-col gap-3 p-3', isDragging && 'border-accent')}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            ref={setActivatorNodeRef}
            aria-label={`Arrastrar ${label} para reordenar`}
            className={cn(iconButton, 'touch-none')}
            {...attributes}
            {...listeners}
          >
            <GripVertical aria-hidden size={22} />
          </button>
          <h3
            className={cn(
              'min-w-0 flex-1 text-label-lg text-pretty',
              name === null && 'text-muted italic',
            )}
          >
            <span aria-hidden className="mr-2 text-accent tabular-nums">
              {position}
            </span>
            {label}
          </h3>
          <button
            type="button"
            aria-label={`Subir ${label}`}
            disabled={isFirst}
            onClick={() => onMove(-1)}
            className={iconButton}
          >
            <ArrowUp aria-hidden size={20} />
          </button>
          <button
            type="button"
            aria-label={`Bajar ${label}`}
            disabled={isLast}
            onClick={() => onMove(1)}
            className={iconButton}
          >
            <ArrowDown aria-hidden size={20} />
          </button>
          <button
            type="button"
            aria-label={`Quitar ${label}`}
            onClick={onRemove}
            className={iconButton}
          >
            <Trash2 aria-hidden size={20} />
          </button>
        </div>

        <div>
          <p className="mb-1 text-body-sm text-muted">Series</p>
          <Stepper
            label={`series de ${label}`}
            value={item.sets}
            min={SETS_MIN}
            max={SETS_MAX}
            onChange={(sets) => onChange({ sets })}
          />
        </div>
        <div>
          <p className="mb-1 text-body-sm text-muted">
            Repeticiones ({REPS_MIN}-{REPS_MAX})
          </p>
          <RepRange
            name={label}
            repsMin={item.repsMin}
            repsMax={item.repsMax}
            onCommit={(repsMin, repsMax) => onChange({ repsMin, repsMax })}
          />
        </div>
        <div>
          <p className="mb-1 text-body-sm text-muted">Descanso (min:seg)</p>
          <Stepper
            label={`descanso de ${label}`}
            value={item.restSec}
            step={REST_STEP_SEC}
            min={REST_MIN_SEC}
            max={REST_MAX_SEC}
            format={formatRest}
            onChange={(restSec) => onChange({ restSec })}
          />
        </div>
      </Card>
    </li>
  );
}

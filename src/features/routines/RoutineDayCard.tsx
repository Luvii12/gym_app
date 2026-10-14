import { ArrowDown, ArrowUp, ChevronRight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Card } from '../../components/ui';
import { cn } from '../../lib/cn';
import { isRestDay, type RoutineDay } from '../../domain';
import { RoutineDayRestSheet } from './RoutineDayRestSheet';

const NAME_MAX = 60;
const NOTE_MAX = 120;

export interface RoutineDayCardProps {
  day: RoutineDay;
  /** Posición en la rotación, desde 0. */
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (changes: Partial<RoutineDay>) => void;
  onMove: (offset: -1 | 1) => void;
  onDelete: () => void;
}

const iconButton =
  'grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-muted ' +
  'active:text-accent disabled:pointer-events-none disabled:opacity-40';

const inputClass =
  'h-11 w-full min-w-0 rounded-md border border-surface-container-high bg-surface-container-lowest ' +
  'px-3 text-body-lg text-on-surface placeholder:text-muted focus:border-accent focus:outline-none';

function summary(day: RoutineDay): string {
  const sets = day.items.reduce((total, item) => total + item.sets, 0);
  const exercises = day.items.length === 1 ? '1 ejercicio' : `${day.items.length} ejercicios`;
  return `${exercises} · ${sets === 1 ? '1 serie' : `${sets} series`}`;
}

export function RoutineDayCard({
  day,
  index,
  isFirst,
  isLast,
  onChange,
  onMove,
  onDelete,
}: RoutineDayCardProps) {
  const rest = isRestDay(day);
  const position = index + 1;
  const [name, setName] = useState(day.name);
  const [note, setNote] = useState(day.note ?? '');
  const [confirmRest, setConfirmRest] = useState(false);

  function commitName() {
    const trimmed = name.trim();
    if (trimmed === '') setName(day.name);
    else if (trimmed !== day.name) onChange({ name: trimmed });
  }

  function commitNote() {
    const trimmed = note.trim();
    if (trimmed === (day.note ?? '')) return;
    onChange({ note: trimmed });
  }

  function setKind(kind: RoutineDay['kind']) {
    if (kind === day.kind) return;
    if (kind === 'rest') {
      if (day.items.length > 0) setConfirmRest(true);
      else onChange({ kind, items: [] });
    } else onChange({ kind });
  }

  return (
    <li>
      <Card
        elevation={1}
        className={cn(
          'flex flex-col gap-3 p-3',
          rest && 'border-dashed bg-surface-container-lowest',
        )}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-md bg-surface-container-high text-label-lg text-accent tabular-nums"
          >
            {position}
          </span>
          <input
            type="text"
            aria-label={`Nombre del día ${position}`}
            value={name}
            maxLength={NAME_MAX}
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
            onBlur={commitName}
            className={inputClass}
          />
          <button
            type="button"
            aria-label={`Borrar día ${position}: ${day.name}`}
            onClick={onDelete}
            className={iconButton}
          >
            <Trash2 aria-hidden size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label={`Tipo del día ${position}`}
            className="flex min-w-0 flex-1 gap-1 rounded-md bg-surface-container-lowest p-1"
          >
            {(
              [
                ['training', 'Entreno'],
                ['rest', 'Descanso'],
              ] as const
            ).map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                aria-pressed={day.kind === kind}
                onClick={() => setKind(kind)}
                className={cn(
                  'min-h-11 flex-1 cursor-pointer rounded-md px-2 text-label-lg',
                  day.kind === kind
                    ? 'bg-accent text-on-accent font-bold'
                    : 'text-muted active:text-accent',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label={`Subir día ${position}`}
            disabled={isFirst}
            onClick={() => onMove(-1)}
            className={iconButton}
          >
            <ArrowUp aria-hidden size={20} />
          </button>
          <button
            type="button"
            aria-label={`Bajar día ${position}`}
            disabled={isLast}
            onClick={() => onMove(1)}
            className={iconButton}
          >
            <ArrowDown aria-hidden size={20} />
          </button>
        </div>

        {rest ? (
          <input
            type="text"
            aria-label={`Nota del día ${position}`}
            value={note}
            maxLength={NOTE_MAX}
            autoComplete="off"
            placeholder="Cardio suave o movilidad · 30 min"
            onChange={(event) => setNote(event.target.value)}
            onBlur={commitNote}
            className={inputClass}
          />
        ) : (
          <Link
            to={`dias/${day.id}`}
            aria-label={`Editar ejercicios de ${day.name}: ${summary(day)}`}
            className="-mx-1 flex min-h-11 items-center justify-between gap-2 rounded-md px-1 text-body-md text-muted tabular-nums active:text-accent"
          >
            <span>{summary(day)}</span>
            <ChevronRight aria-hidden size={20} />
          </Link>
        )}
      </Card>
      {confirmRest && (
        <RoutineDayRestSheet
          day={day}
          onClose={() => setConfirmRest(false)}
          onConfirm={() => {
            setConfirmRest(false);
            onChange({ kind: 'rest', items: [] });
          }}
        />
      )}
    </li>
  );
}

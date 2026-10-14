import { EllipsisVertical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Sheet } from '../../components/ui';
import {
  MUSCLE_GROUP_LABELS,
  nextPendingSet,
  setsOf,
  targetOf,
  type Exercise,
  type LastPerformance,
  type WorkoutSession,
} from '../../domain';
import { SetRow } from './SetRow';

export interface ExerciseCardProps {
  session: WorkoutSession;
  exerciseId: string;
  /** `undefined` si el ejercicio ya no está en el catálogo. */
  exercise?: Exercise;
  last?: LastPerformance;
  onChangeSet: (setIndex: number, changes: { weightKg?: number; reps?: number }) => void;
  onToggleSet: (setIndex: number) => void;
  onAddSet: () => void;
  onRemove: () => void;
}

export function ExerciseCard({
  session,
  exerciseId,
  exercise,
  last,
  onChangeSet,
  onToggleSet,
  onAddSet,
  onRemove,
}: ExerciseCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const sets = setsOf(session, exerciseId);
  const target = targetOf(session, exerciseId);
  const current = nextPendingSet(session, exerciseId);
  const name = exercise?.name ?? 'Ejercicio eliminado';
  const group = exercise ? MUSCLE_GROUP_LABELS[exercise.muscleGroup] : 'Sin grupo';

  return (
    <Card aria-label={name} role="group" className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 py-2 pr-1 pl-4">
        <div className="min-w-0">
          <h3 className="text-headline-sm text-pretty">{name}</h3>
          <p className="text-body-sm text-muted">
            {group} · {sets.length} {sets.length === 1 ? 'serie' : 'series'}
          </p>
        </div>
        <button
          type="button"
          aria-label={`Opciones de ${name}`}
          onClick={() => setMenuOpen(true)}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-muted active:text-on-surface"
        >
          <EllipsisVertical aria-hidden size={22} />
        </button>
      </div>

      <div className="grid grid-cols-[1.75rem_1fr_1fr_2.75rem] gap-2 px-3 pb-1 text-center text-label-sm text-muted uppercase">
        <span>Serie</span>
        <span>Kg</span>
        <span>Reps</span>
        <span>Hecho</span>
      </div>
      <ol>
        {sets.map((set) => (
          <SetRow
            key={set.setIndex}
            exerciseName={name}
            set={set}
            isCurrent={current?.setIndex === set.setIndex}
            target={target}
            {...(last ? { last } : {})}
            onChange={(changes) => onChangeSet(set.setIndex, changes)}
            onToggle={() => onToggleSet(set.setIndex)}
          />
        ))}
      </ol>
      <div className="p-3">
        <Button variant="outline" fullWidth onClick={onAddSet}>
          <Plus aria-hidden size={20} />
          Añadir serie
        </Button>
      </div>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={name}>
        <Button
          variant="ghost"
          fullWidth
          className="justify-start text-danger"
          onClick={() => {
            setMenuOpen(false);
            setConfirming(true);
          }}
        >
          <Trash2 aria-hidden size={20} />
          Quitar ejercicio
        </Button>
      </Sheet>
      <Sheet open={confirming} onClose={() => setConfirming(false)} title="¿Quitar ejercicio?">
        <p className="mb-4 text-body-md text-muted">
          Se quitarán {name} y sus series de este entreno, también las que ya hayas marcado.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              setConfirming(false);
              onRemove();
            }}
          >
            Quitar ejercicio
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setConfirming(false)}>
            Cancelar
          </Button>
        </div>
      </Sheet>
    </Card>
  );
}

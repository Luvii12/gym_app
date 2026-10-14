import { Check, SearchX } from 'lucide-react';
import { useState } from 'react';
import { Chip, EmptyState, SearchField, Sheet } from '../../components/ui';
import {
  MUSCLE_GROUP_LABELS,
  filterExercises,
  groupsWithExercises,
  type Exercise,
  type MuscleGroup,
} from '../../domain';
import { cn } from '../../lib/cn';

export interface ExercisePickerSheetProps {
  /** Catálogo visible (sin archivados). */
  exercises: Exercise[];
  /** Ejercicios que el día ya tiene. */
  presentIds: ReadonlySet<string>;
  onAdd: (exerciseId: string) => void;
  onClose: () => void;
}

/** Hoja con buscador y filtros por grupo; permite añadir varios ejercicios sin cerrarse. */
export function ExercisePickerSheet({
  exercises,
  presentIds,
  onAdd,
  onClose,
}: ExercisePickerSheetProps) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MuscleGroup | null>(null);
  const results = filterExercises(exercises, { group, query });
  const groups = groupsWithExercises(exercises);

  return (
    <Sheet open onClose={onClose} title="Añadir ejercicio">
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Buscar ejercicio o músculo…"
        label="Buscar ejercicio o músculo"
      />
      <div
        role="group"
        aria-label="Filtrar por grupo muscular"
        className="-mx-4 mt-3 mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Chip selected={group === null} onClick={() => setGroup(null)}>
          Todos
        </Chip>
        {groups.map((value) => (
          <Chip key={value} selected={group === value} onClick={() => setGroup(value)}>
            {MUSCLE_GROUP_LABELS[value]}
          </Chip>
        ))}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Sin resultados"
          description="Prueba con otro nombre o quita el filtro de grupo."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {results.map((exercise) => {
            const present = presentIds.has(exercise.id);
            return (
              <li key={exercise.id}>
                <button
                  type="button"
                  disabled={present}
                  aria-label={
                    present ? `${exercise.name}, ya está en el día` : `Añadir ${exercise.name}`
                  }
                  onClick={() => onAdd(exercise.id)}
                  className={cn(
                    'flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-4 py-2 text-left',
                    'border-surface-container-high bg-surface-container-lowest active:border-accent',
                    present && 'pointer-events-none opacity-60',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-label-lg text-pretty">{exercise.name}</span>
                    <span className="block text-body-sm text-muted">
                      {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                    </span>
                  </span>
                  {present && (
                    <span className="flex shrink-0 items-center gap-1 text-label-md text-accent">
                      <Check aria-hidden size={18} />
                      En el día
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}

import { Dumbbell, SearchX } from 'lucide-react';
import { useState } from 'react';
import { Button, Chip, EmptyState, SearchField } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';
import { useExercises } from '../../db';
import {
  MUSCLE_GROUP_LABELS,
  filterExercises,
  groupsWithExercises,
  type MuscleGroup,
} from '../../domain';
import { ExerciseCard } from './ExerciseCard';

const SKELETON_COUNT = 5;

function ExerciseListSkeleton() {
  return (
    <ul aria-busy="true" aria-label="Cargando ejercicios" className="flex flex-col gap-3">
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <li
          key={index}
          className="h-36 animate-pulse rounded-lg border border-surface-container-high bg-surface-container-low"
        />
      ))}
    </ul>
  );
}

export function ExercisesPage() {
  const exercises = useExercises();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MuscleGroup | null>(null);

  const results = exercises ? filterExercises(exercises, { group, query }) : [];
  const groups = exercises ? groupsWithExercises(exercises) : [];
  const count = results.length;

  function clearFilters() {
    setQuery('');
    setGroup(null);
  }

  return (
    <>
      <PageHeader
        title="Catálogo de Ejercicios"
        action={
          exercises && (
            <p aria-live="polite" className="shrink-0 pt-2 text-label-md text-muted tabular-nums">
              {count === 1 ? '1 ejercicio' : `${count} ejercicios`}
            </p>
          )
        }
      />
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Buscar ejercicio o músculo…"
        label="Buscar ejercicio o músculo"
      />
      <div
        role="group"
        aria-label="Filtrar por grupo muscular"
        className="-mx-4 mt-4 mb-5 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

      {exercises === undefined ? (
        <ExerciseListSkeleton />
      ) : exercises.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Aún no hay ejercicios"
          description="Aquí aparecerán los ejercicios del catálogo y los que crees tú."
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Sin resultados"
          description="Prueba con otro nombre o quita el filtro de grupo."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {results.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </ul>
      )}
    </>
  );
}

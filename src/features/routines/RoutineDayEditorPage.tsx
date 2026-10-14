import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ArrowLeft, Layers, ListPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Button, Card, EmptyState } from '../../components/ui';
import { useAllExercises, useExercises, useRoutine } from '../../db';
import {
  addExercisesToItems,
  insertItem,
  isRestDay,
  moveItem,
  removeItem,
  updateItem,
  type RoutineItem,
} from '../../domain';
import { ExercisePickerSheet } from './ExercisePickerSheet';
import { RoutineItemCard } from './RoutineItemCard';
import { useRoutineSaver } from './useRoutineSaver';

const UNDO_MS = 6000;

interface Removed {
  item: RoutineItem;
  index: number;
  name: string;
}

export function RoutineDayEditorPage() {
  const { routineId = '', dayId = '' } = useParams();
  const routine = useRoutine(routineId);
  const catalog = useExercises();
  const allExercises = useAllExercises();
  const { save, failure } = useRoutineSaver(routineId);
  const [picking, setPicking] = useState(false);
  const [removed, setRemoved] = useState<Removed | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!removed) return;
    const timer = setTimeout(() => setRemoved(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [removed]);

  function patchItems(compute: (items: RoutineItem[]) => RoutineItem[]) {
    return save((current) => ({
      days: current.days.map((day) =>
        day.id === dayId && !isRestDay(day) ? { ...day, items: compute(day.items) } : day,
      ),
    }));
  }

  const day = routine?.days.find((candidate) => candidate.id === dayId);

  if (routine === undefined || allExercises === undefined) {
    return (
      <p aria-busy="true" className="h-32 animate-pulse rounded-lg bg-surface-container-low" />
    );
  }

  if (routine === null || !day || isRestDay(day)) {
    const missingRoutine = routine === null;
    return (
      <>
        <EmptyState
          icon={Layers}
          title={
            missingRoutine ? 'Rutina no encontrada' : day ? 'Día de descanso' : 'Día no encontrado'
          }
          description={
            day
              ? 'Los días de descanso activo no tienen ejercicios que editar.'
              : 'Puede que se haya borrado o que el enlace no sea correcto.'
          }
        />
        <Link
          to={missingRoutine ? '/rutinas' : `/rutinas/${routine.id}`}
          className="mx-auto mt-4 inline-flex min-h-12 items-center gap-2 px-4 text-label-lg text-accent"
        >
          <ArrowLeft aria-hidden size={20} />
          {missingRoutine ? 'Volver a mis rutinas' : 'Volver a la rutina'}
        </Link>
      </>
    );
  }

  const names = new Map(allExercises.map((exercise) => [exercise.id, exercise.name]));
  const presentIds = new Set(day.items.map((item) => item.exerciseId));
  const totalSets = day.items.reduce((total, item) => total + item.sets, 0);

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    void patchItems((items) =>
      moveItem(
        items,
        items.findIndex((item) => item.exerciseId === active.id),
        items.findIndex((item) => item.exerciseId === over.id),
      ),
    );
  }

  function handleMove(exerciseId: string, offset: -1 | 1) {
    void patchItems((items) => {
      const from = items.findIndex((item) => item.exerciseId === exerciseId);
      return moveItem(items, from, from + offset);
    });
  }

  function handleRemove(item: RoutineItem, index: number) {
    setRemoved({ item, index, name: names.get(item.exerciseId) ?? 'Ejercicio eliminado' });
    void patchItems((items) => removeItem(items, item.exerciseId));
  }

  function handleUndo() {
    if (!removed) return;
    const { item, index } = removed;
    setRemoved(null);
    void patchItems((items) => insertItem(items, item, index));
  }

  return (
    <>
      <Link
        to={`/rutinas/${routine.id}`}
        className="-ml-2 inline-flex min-h-12 items-center gap-2 px-2 text-label-lg text-muted active:text-accent"
      >
        <ArrowLeft aria-hidden size={20} />
        {routine.name}
      </Link>
      <p className="flex items-center gap-2 text-label-md font-bold tracking-wide text-accent uppercase">
        <span aria-hidden className="size-2 rounded-full bg-accent" />
        Editor de día
      </p>
      <h1 className="pb-1 text-headline-xl text-balance">{day.name}</h1>
      <p className="pb-4 text-body-md text-muted tabular-nums">
        {day.items.length === 1 ? '1 ejercicio' : `${day.items.length} ejercicios`} ·{' '}
        {totalSets === 1 ? '1 serie' : `${totalSets} series`}
      </p>

      {failure && (
        <p role="alert" className="pb-3 text-body-md text-danger">
          {failure}
        </p>
      )}

      {day.items.length === 0 ? (
        <Card className="p-4 text-body-md text-muted">
          Este día aún no tiene ejercicios. Añade el primero desde el catálogo.
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={day.items.map((item) => item.exerciseId)}
            strategy={verticalListSortingStrategy}
          >
            <ol aria-label="Ejercicios del día" className="flex flex-col gap-3">
              {day.items.map((item, index) => (
                <RoutineItemCard
                  key={item.exerciseId}
                  item={item}
                  name={names.get(item.exerciseId) ?? null}
                  position={index + 1}
                  isFirst={index === 0}
                  isLast={index === day.items.length - 1}
                  onChange={(changes) =>
                    void patchItems((items) => updateItem(items, item.exerciseId, changes))
                  }
                  onMove={(offset) => handleMove(item.exerciseId, offset)}
                  onRemove={() => handleRemove(item, index)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <Button
        variant="secondary"
        fullWidth
        onClick={() => setPicking(true)}
        className="mt-3 mb-28 border-dashed"
      >
        <ListPlus aria-hidden size={20} />
        Añadir ejercicio desde catálogo
      </Button>

      {picking && (
        <ExercisePickerSheet
          exercises={catalog ?? []}
          presentIds={presentIds}
          onAdd={(exerciseId) =>
            void patchItems((items) => addExercisesToItems(items, [exerciseId]))
          }
          onClose={() => setPicking(false)}
        />
      )}

      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-4 bottom-[calc(4.25rem+env(safe-area-inset-bottom)+1rem)] z-40 mx-auto flex max-w-170 justify-center"
      >
        {removed && (
          <div className="flex items-center gap-2 rounded-md bg-inverse-surface py-1 pr-1 pl-4 text-label-lg text-inverse-on-surface shadow-overlay">
            <span>{removed.name} quitado</span>
            <button
              type="button"
              onClick={handleUndo}
              className="min-h-11 cursor-pointer rounded-md px-3 font-bold underline"
            >
              Deshacer
            </button>
          </div>
        )}
      </div>
    </>
  );
}

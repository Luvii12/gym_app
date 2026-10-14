import { ArrowLeft, Layers, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Button, Card, EmptyState, Stepper, TextField } from '../../components/ui';
import { useRoutine } from '../../db';
import type { RoutineDay } from '../../domain';
import { RoutineDayCard } from './RoutineDayCard';
import { RoutineDayDeleteSheet } from './RoutineDayDeleteSheet';
import { ROUTINE_NAME_MAX } from './RoutineNameSheet';
import { useRoutineSaver } from './useRoutineSaver';

export function RoutineEditorPage() {
  const { routineId = '' } = useParams();
  const routine = useRoutine(routineId);
  const { save, failure } = useRoutineSaver(routineId);
  const [pendingDelete, setPendingDelete] = useState<RoutineDay | null>(null);
  const [nameDraft, setNameDraft] = useState<string | null>(null);

  function patchDay(dayId: string, changes: Partial<RoutineDay>) {
    void save((current) => ({
      days: current.days.map((day) => (day.id === dayId ? { ...day, ...changes } : day)),
    }));
  }

  function addDay(kind: RoutineDay['kind']) {
    void save((current) => {
      const day: RoutineDay =
        kind === 'rest'
          ? { id: crypto.randomUUID(), name: 'Descanso', kind, items: [] }
          : { id: crypto.randomUUID(), name: `Día ${current.days.length + 1}`, kind, items: [] };
      return { days: [...current.days, day] };
    });
  }

  function moveDay(dayId: string, offset: -1 | 1) {
    void save((current) => {
      const days = [...current.days];
      const from = days.findIndex((day) => day.id === dayId);
      const to = from + offset;
      if (from < 0 || to < 0 || to >= days.length) return {};
      [days[from], days[to]] = [days[to]!, days[from]!];
      return { days };
    });
  }

  function removeDay(dayId: string) {
    setPendingDelete(null);
    void save((current) => ({ days: current.days.filter((day) => day.id !== dayId) }));
  }

  if (routine === undefined) {
    return (
      <p aria-busy="true" className="h-32 animate-pulse rounded-lg bg-surface-container-low" />
    );
  }

  if (routine === null) {
    return (
      <>
        <EmptyState
          icon={Layers}
          title="Rutina no encontrada"
          description="Puede que se haya borrado o que el enlace no sea correcto."
        />
        <Link
          to="/rutinas"
          className="mx-auto mt-4 inline-flex min-h-12 items-center gap-2 px-4 text-label-lg text-accent"
        >
          <ArrowLeft aria-hidden size={20} />
          Volver a mis rutinas
        </Link>
      </>
    );
  }

  const nameValue = nameDraft ?? routine.name;
  const nameError =
    nameDraft !== null && nameDraft.trim() === '' ? 'Escribe un nombre.' : undefined;

  function commitName() {
    if (nameDraft === null) return;
    const trimmed = nameDraft.trim();
    setNameDraft(null);
    if (trimmed !== '' && trimmed !== routine?.name) void save(() => ({ name: trimmed }));
  }

  return (
    <>
      <Link
        to="/rutinas"
        className="-ml-2 inline-flex min-h-12 items-center gap-2 px-2 text-label-lg text-muted active:text-accent"
      >
        <ArrowLeft aria-hidden size={20} />
        Mis rutinas
      </Link>
      <h1 className="pb-4 text-headline-xl text-balance">Editar rutina</h1>

      <div className="flex flex-col gap-4 pb-6">
        <TextField
          label="Nombre de la rutina"
          value={nameValue}
          onChange={setNameDraft}
          onBlur={commitName}
          maxLength={ROUTINE_NAME_MAX}
          autoComplete="off"
          error={nameError}
        />
        <div>
          <p className="mb-2 text-label-lg">Días por semana</p>
          <Stepper
            label="días por semana"
            value={routine.daysPerWeek}
            min={1}
            max={7}
            onChange={(daysPerWeek) => void save(() => ({ daysPerWeek }))}
          />
        </div>

        {failure && (
          <p role="alert" className="text-body-md text-danger">
            {failure}
          </p>
        )}

        <section aria-labelledby="days-title">
          <h2 id="days-title" className="mb-1 text-headline-md">
            Días de la rotación
          </h2>
          <p className="mb-3 text-body-md text-muted">
            Se siguen en este orden, de arriba abajo, y vuelven a empezar.
          </p>
          {routine.days.length === 0 ? (
            <Card className="p-4 text-body-md text-muted">Aún no hay días. Añade el primero.</Card>
          ) : (
            <ol className="flex flex-col gap-3">
              {routine.days.map((day, index) => (
                <RoutineDayCard
                  key={day.id}
                  day={day}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === routine.days.length - 1}
                  onChange={(changes) => patchDay(day.id, changes)}
                  onMove={(offset) => moveDay(day.id, offset)}
                  onDelete={() => setPendingDelete(day)}
                />
              ))}
            </ol>
          )}
          <div className="mt-3 flex flex-col gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => addDay('training')}
              className="border-dashed"
            >
              <Plus aria-hidden size={20} />
              Añadir día de entreno
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => addDay('rest')}
              className="border-dashed"
            >
              <Plus aria-hidden size={20} />
              Añadir día de descanso activo
            </Button>
          </div>
        </section>
      </div>

      {pendingDelete && (
        <RoutineDayDeleteSheet
          day={pendingDelete}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => removeDay(pendingDelete.id)}
        />
      )}
    </>
  );
}

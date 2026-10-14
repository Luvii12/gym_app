import { ChevronLeft, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button, Card, EmptyState, Stepper } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';
import { sessionRepository, useAllExercises, useSession } from '../../db';
import {
  WEIGHT_STEP_KG,
  deleteLoggedSet,
  exerciseOrder,
  removeExercise,
  sessionDuration,
  sessionVolume,
  setsOf,
  updateSet,
  type WorkoutSession,
} from '../../domain';
import { formatNumber } from '../../lib/number';
import { DeleteSessionSheet } from './DeleteSessionSheet';
import { formatMinutes, formatSessionDate, formatSessionTime } from './format';

const backLink =
  '-ml-2 mb-1 inline-flex min-h-11 items-center gap-1 px-2 text-label-lg text-muted active:text-accent';

export function HistorySessionPage() {
  const { sessionId = '' } = useParams();
  const navigate = useNavigate();
  const session = useSession(sessionId);
  const exercises = useAllExercises();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (session === undefined || exercises === undefined) return null;

  if (session === null) {
    return (
      <EmptyState
        icon={Trash2}
        title="Entreno no encontrado"
        description="Puede que se haya borrado."
        action={
          <Link to="/progreso/historial">
            <Button variant="secondary" tabIndex={-1}>
              Ir al historial
            </Button>
          </Link>
        }
      />
    );
  }

  const names = new Map(exercises.map((e) => [e.id, e.name]));
  const duration = sessionDuration(session);
  const isEmpty = session.sets.length === 0;

  async function apply(next: WorkoutSession) {
    await sessionRepository.save(next);
    if (next.sets.length === 0) setConfirmDelete(true);
  }

  async function handleDelete() {
    await sessionRepository.remove(session!.id);
    void navigate('/progreso/historial', { replace: true });
  }

  return (
    <>
      <Link to="/progreso/historial" className={backLink}>
        <ChevronLeft aria-hidden size={20} />
        Historial
      </Link>
      <PageHeader
        title={session.name}
        description={`${formatSessionDate(session.startedAt)} · ${formatSessionTime(session.startedAt)}`}
        action={
          <Button
            variant={editing ? 'primary' : 'secondary'}
            pill
            className="shrink-0"
            onClick={() => setEditing((v) => !v)}
          >
            {!editing && <Pencil aria-hidden size={18} />}
            {editing ? 'Listo' : 'Editar'}
          </Button>
        }
      />
      <p className="mb-4 text-body-md text-muted tabular-nums">
        {duration !== undefined && `${formatMinutes(duration)} · `}
        {formatNumber(sessionVolume(session))} kg de volumen
      </p>

      {isEmpty && <p className="mb-4 text-body-md text-muted">Este entreno no tiene series.</p>}

      <ul className="flex flex-col gap-3">
        {exerciseOrder(session).map((exerciseId) => {
          const name = names.get(exerciseId) ?? 'Ejercicio eliminado';
          const sets = setsOf(session, exerciseId);
          return (
            <li key={exerciseId}>
              <Card className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-headline-sm text-pretty">{name}</h2>
                  {editing && (
                    <button
                      type="button"
                      aria-label={`Quitar ${name}`}
                      onClick={() => void apply(removeExercise(session, exerciseId))}
                      className="-mr-2 grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-danger"
                    >
                      <Trash2 aria-hidden size={20} />
                    </button>
                  )}
                </div>
                <ol className="mt-2 flex flex-col gap-2">
                  {sets.map((set) => {
                    const number = set.setIndex + 1;
                    return editing ? (
                      <li
                        key={set.setIndex}
                        className="grid grid-cols-[1.5rem_1fr_1fr_2.75rem] items-center gap-2"
                      >
                        <span className="text-label-lg text-muted tabular-nums">{number}</span>
                        <Stepper
                          compact
                          label={`peso de la serie ${number} de ${name}`}
                          value={set.weightKg}
                          step={WEIGHT_STEP_KG}
                          max={999}
                          onChange={(weightKg) =>
                            void apply(updateSet(session, exerciseId, set.setIndex, { weightKg }))
                          }
                        />
                        <Stepper
                          compact
                          label={`repeticiones de la serie ${number} de ${name}`}
                          value={set.reps}
                          onChange={(reps) =>
                            void apply(updateSet(session, exerciseId, set.setIndex, { reps }))
                          }
                        />
                        <button
                          type="button"
                          aria-label={`Quitar serie ${number} de ${name}`}
                          onClick={() =>
                            void apply(deleteLoggedSet(session, exerciseId, set.setIndex))
                          }
                          className="grid size-11 cursor-pointer place-items-center rounded-md text-danger"
                        >
                          <X aria-hidden size={20} />
                        </button>
                      </li>
                    ) : (
                      <li key={set.setIndex} className="flex gap-3 text-body-lg tabular-nums">
                        <span className="w-6 text-muted">{number}</span>
                        <span>
                          {formatNumber(set.weightKg)} kg × {set.reps}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            </li>
          );
        })}
      </ul>

      <Button
        variant="ghost"
        fullWidth
        className="mt-6 text-danger"
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 aria-hidden size={20} />
        Borrar entreno
      </Button>

      {confirmDelete && (
        <DeleteSessionSheet
          empty={isEmpty}
          onConfirm={() => void handleDelete()}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

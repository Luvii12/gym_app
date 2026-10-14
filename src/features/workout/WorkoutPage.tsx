import { CirclePlus, Dumbbell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Button, EmptyState, Toast } from '../../components/ui';
import {
  addExercise,
  addSet,
  exerciseOrder,
  finishSession,
  lastPerformances,
  removeExercise,
  sessionProgress,
  setsOf,
  targetOf,
  toggleSet,
  updateSet,
} from '../../domain';
import {
  sessionRepository,
  useActiveSession,
  useAllExercises,
  useExercises,
  useFinishedSessions,
} from '../../db';
import { ExercisePickerSheet } from '../routines/ExercisePickerSheet';
import { ExerciseCard } from './ExerciseCard';
import { FinishSheet } from './FinishSheet';
import { RestHost } from './RestHost';
import { WorkoutHeader } from './WorkoutHeader';
import { useNow } from './useNow';
import { useRestTimer } from './useRestTimer';
import { useSessionEditor } from './useSessionEditor';
import { useWakeLock } from './useWakeLock';
import type { WorkoutSession } from '../../domain';

const now = () => Date.now();

export function WorkoutPage() {
  const session = useActiveSession();
  if (session === undefined) return null;
  if (session === null) return <Navigate to="/" replace />;
  return <ActiveWorkout session={session} />;
}

function ActiveWorkout({ session }: { session: WorkoutSession }) {
  const navigate = useNavigate();
  const { edit, flush } = useSessionEditor(session);
  const exercises = useAllExercises();
  const catalog = useExercises();
  const finished = useFinishedSessions();
  const startRest = useRestTimer((state) => state.start);
  const stopRest = useRestTimer((state) => state.stop);
  const tick = useNow(1000);
  const [picking, setPicking] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useWakeLock(true);

  // El descanso es de este entreno: al salir de la pantalla no debe quedar en marcha.
  useEffect(() => () => stopRest(), [stopRest]);

  if (exercises === undefined || finished === undefined) return null;

  const last = lastPerformances(finished);
  const { done, total } = sessionProgress(session);
  const presentIds = new Set(session.sets.map((set) => set.exerciseId));

  function handleToggle(exerciseId: string, setIndex: number) {
    const wasDone =
      setsOf(session, exerciseId).find((s) => s.setIndex === setIndex)?.completedAt !== undefined;
    const at = now();
    const next = edit((current) => toggleSet(current, exerciseId, setIndex, at));
    if (wasDone) return;
    const restSec = targetOf(next, exerciseId).restSec;
    if (restSec > 0) startRest({ durationSec: restSec, exerciseId, setIndex, now: at });
    else stopRest();
  }

  async function handleLeave(action: () => Promise<unknown>, message?: string) {
    try {
      await flush();
      await action();
      stopRest();
      navigate('/', { replace: true, ...(message ? { state: { toast: message } } : {}) });
    } catch {
      setError('No se pudo guardar. Inténtalo de nuevo.');
    }
  }

  return (
    <div className="min-h-dvh pb-40">
      <WorkoutHeader
        name={session.name}
        elapsedMs={tick - session.startedAt}
        done={done}
        total={total}
        onFinish={() => setFinishing(true)}
      />
      <main className="mx-auto flex max-w-170 flex-col gap-4 px-4 pt-4">
        {session.sets.length === 0 && (
          <EmptyState
            icon={Dumbbell}
            title="Entreno vacío"
            description="Añade el primer ejercicio para empezar a registrar series."
          />
        )}
        {exerciseOrder(session).map((exerciseId) => {
          const exercise = exercises?.find((e) => e.id === exerciseId);
          const performance = last[exerciseId];
          return (
            <ExerciseCard
              key={exerciseId}
              session={session}
              exerciseId={exerciseId}
              {...(exercise ? { exercise } : {})}
              {...(performance ? { last: performance } : {})}
              onChangeSet={(setIndex, changes) =>
                edit((current) => updateSet(current, exerciseId, setIndex, changes))
              }
              onToggleSet={(setIndex) => handleToggle(exerciseId, setIndex)}
              onAddSet={() => edit((current) => addSet(current, exerciseId))}
              onRemove={() => edit((current) => removeExercise(current, exerciseId))}
            />
          );
        })}
        <Button variant="secondary" fullWidth onClick={() => setPicking(true)}>
          <CirclePlus aria-hidden size={20} />
          Añadir ejercicio
        </Button>
      </main>

      {picking && (
        <ExercisePickerSheet
          exercises={catalog ?? []}
          presentIds={presentIds}
          onAdd={(exerciseId) =>
            edit((current) => addExercise(current, exerciseId, last[exerciseId]))
          }
          onClose={() => setPicking(false)}
        />
      )}
      {finishing && (
        <FinishSheet
          done={done}
          total={total}
          onClose={() => setFinishing(false)}
          onFinish={() =>
            void handleLeave(async () => {
              const current = (await sessionRepository.getActive()) ?? session;
              await sessionRepository.save(finishSession(current, Date.now()));
            }, 'Entreno guardado')
          }
          onDiscard={() => void handleLeave(() => sessionRepository.remove(session.id))}
        />
      )}
      <RestHost session={session} exercises={exercises ?? []} />
      <Toast message={error} />
    </div>
  );
}

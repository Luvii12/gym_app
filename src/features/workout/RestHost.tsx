import { useEffect, useState } from 'react';
import { restRemainingSec, type Exercise, type WorkoutSession } from '../../domain';
import { RestBanner } from './RestBanner';
import { RestSheet } from './RestSheet';
import { playBeep, vibrate } from './restAlert';
import { useNow } from './useNow';
import { useRestTimer } from './useRestTimer';
import { useWorkoutPrefs } from './useWorkoutPrefs';

export interface RestHostProps {
  session: WorkoutSession;
  exercises: readonly Exercise[];
}

/** Banner y hoja del descanso; avisa y se retira solo al llegar a 0. */
export function RestHost({ session, exercises }: RestHostProps) {
  const { endsAt, durationSec, exerciseId, setIndex, runId, adjust, stop } = useRestTimer();
  const [expanded, setExpanded] = useState<number | null>(null);
  const running = endsAt !== null;
  const now = useNow(250, running);
  const remaining = endsAt === null ? 0 : restRemainingSec(endsAt, now);

  useEffect(() => {
    if (!running || remaining > 0) return;
    const { soundEnabled, vibrationEnabled } = useWorkoutPrefs.getState();
    if (vibrationEnabled) vibrate();
    if (soundEnabled) playBeep();
    stop();
  }, [running, remaining, stop]);

  if (!running || exerciseId === null) return null;
  const skip = () => {
    setExpanded(null);
    stop();
  };

  return (
    <>
      <RestBanner
        remainingSec={remaining}
        onOpen={() => setExpanded(runId)}
        onAdd={() => adjust(30, Date.now())}
        onSkip={skip}
      />
      {expanded === runId && (
        <RestSheet
          session={session}
          exerciseId={exerciseId}
          setIndex={setIndex}
          exerciseName={exercises.find((e) => e.id === exerciseId)?.name ?? 'Ejercicio'}
          remainingSec={remaining}
          durationSec={durationSec}
          onAdjust={(delta) => adjust(delta, Date.now())}
          onSkip={skip}
          onClose={() => setExpanded(null)}
        />
      )}
    </>
  );
}

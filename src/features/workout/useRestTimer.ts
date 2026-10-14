import { create } from 'zustand';

interface RestTimer {
  /** Instante (ms) en que acaba el descanso; `null` = sin descanso en marcha. */
  endsAt: number | null;
  /** Duración total, para la barra de progreso. */
  durationSec: number;
  /** Cambia en cada descanso nuevo (para que una hoja abierta no sobreviva al siguiente). */
  runId: number;
  /** Serie que se acaba de completar. */
  exerciseId: string | null;
  setIndex: number;
  start: (input: {
    durationSec: number;
    exerciseId: string;
    setIndex: number;
    now: number;
  }) => void;
  /** Suma (o resta, si es negativo) segundos; con el resultado en 0 o menos, acaba. */
  adjust: (deltaSec: number, now: number) => void;
  stop: () => void;
}

const idle = { endsAt: null, durationSec: 0, exerciseId: null, setIndex: 0 } as const;

export const useRestTimer = create<RestTimer>()((set) => ({
  ...idle,
  runId: 0,
  start: ({ durationSec, exerciseId, setIndex, now }) =>
    set((state) => ({
      endsAt: now + durationSec * 1000,
      durationSec,
      exerciseId,
      setIndex,
      runId: state.runId + 1,
    })),
  adjust: (deltaSec, now) =>
    set((state) => {
      if (state.endsAt === null) return state;
      const endsAt = state.endsAt + deltaSec * 1000;
      if (endsAt <= now) return { ...idle };
      return { endsAt, durationSec: Math.max(1, state.durationSec + deltaSec) };
    }),
  stop: () => set({ ...idle }),
}));

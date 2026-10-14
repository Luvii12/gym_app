export interface LoggedSet {
  exerciseId: string;
  /** Posición de la serie dentro de su ejercicio, desde 0. */
  setIndex: number;
  /** Carga externa en kg. 0 = solo peso corporal; en lastradas, el lastre añadido. */
  weightKg: number;
  reps: number;
  /** Sin valor = serie prevista aún sin hacer (fila sin marcar en el entreno). */
  completedAt?: number;
}

/** Lo previsto para un ejercicio de la sesión (viene de la rutina; en lo añadido al vuelo, por defecto). */
export interface SessionTarget {
  repsMin: number;
  repsMax: number;
  restSec: number;
}

export interface WorkoutSession {
  id: string;
  /** Nombre del día en el momento de empezar ("Pull (Día B)"): el historial no cambia si luego se renombra. */
  name: string;
  /** Ausentes en un entreno libre. */
  routineId?: string;
  routineDayId?: string;
  startedAt: number;
  /** Sin valor = sesión en curso. */
  endedAt?: number;
  /** El orden de los ejercicios es el de su primera aparición en `sets`. */
  sets: LoggedSet[];
  /** Objetivo y descanso por ejercicio, por `exerciseId`. */
  targets?: Record<string, SessionTarget>;
}

export function isSessionActive(session: WorkoutSession): boolean {
  return session.endedAt === undefined;
}

export function completedSets(session: WorkoutSession): LoggedSet[] {
  return session.sets.filter((set) => set.completedAt !== undefined);
}

/** Duración en ms de una sesión terminada; `undefined` si sigue en curso. */
export function sessionDuration(session: WorkoutSession): number | undefined {
  return session.endedAt === undefined
    ? undefined
    : Math.max(0, session.endedAt - session.startedAt);
}

/**
 * Quita una serie de una sesión ya hecha (a diferencia de `removeSet`, también las completadas).
 * Las siguientes del ejercicio se renumeran; si era la última del ejercicio, desaparece con su objetivo.
 */
export function deleteLoggedSet(
  session: WorkoutSession,
  exerciseId: string,
  setIndex: number,
): WorkoutSession {
  const exists = session.sets.some((s) => s.exerciseId === exerciseId && s.setIndex === setIndex);
  if (!exists) return session;
  const sets = session.sets
    .filter((s) => !(s.exerciseId === exerciseId && s.setIndex === setIndex))
    .map((s) =>
      s.exerciseId === exerciseId && s.setIndex > setIndex ? { ...s, setIndex: s.setIndex - 1 } : s,
    );
  const targets = Object.fromEntries(
    Object.entries(session.targets ?? {}).filter(([id]) => sets.some((s) => s.exerciseId === id)),
  );
  return { ...session, sets, targets };
}

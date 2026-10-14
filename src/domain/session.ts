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
}

export function isSessionActive(session: WorkoutSession): boolean {
  return session.endedAt === undefined;
}

export function completedSets(session: WorkoutSession): LoggedSet[] {
  return session.sets.filter((set) => set.completedAt !== undefined);
}

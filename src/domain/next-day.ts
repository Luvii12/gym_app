import { isRestDay, type Routine, type RoutineDay } from './routine';
import { isSessionActive, type WorkoutSession } from './session';

/**
 * Día de entreno que toca después de la última sesión completada de la rutina.
 * Los días de descanso activo no entran en la rotación. Las sesiones en curso,
 * los entrenos libres y los días que ya no existen se ignoran: en ese caso se
 * parte de la sesión anterior que siga teniendo día. Sin ninguna, el primero.
 * `undefined` si la rutina no tiene días de entreno.
 */
export function nextDay(routine: Routine, sessions: WorkoutSession[]): RoutineDay | undefined {
  const { days } = routine;
  if (!days.some((day) => !isRestDay(day))) return undefined;

  const lastIndex = lastDoneDayIndex(routine, sessions);
  for (let step = 1; step <= days.length; step++) {
    const day = days[(lastIndex + step) % days.length];
    if (day && !isRestDay(day)) return day;
  }
  return undefined;
}

/** Posición del día de la sesión completada más reciente; -1 si no hay ninguna. */
function lastDoneDayIndex(routine: Routine, sessions: WorkoutSession[]): number {
  const done = sessions
    .filter((s) => !isSessionActive(s) && s.routineDayId !== undefined)
    .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0));
  for (const s of done) {
    const index = routine.days.findIndex((day) => day.id === s.routineDayId);
    if (index !== -1) return index;
  }
  return -1;
}

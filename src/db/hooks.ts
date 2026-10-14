import { useLiveQuery } from 'dexie-react-hooks';
import type { Exercise, Routine, WorkoutSession } from '../domain';
import { backupRepository } from './backup';
import { exerciseRepository } from './exercises';
import { routineRepository } from './routines';
import { sessionRepository } from './sessions';

/** Ejercicios ordenados por nombre. `undefined` solo mientras responde la base por primera vez. */
export function useExercises(): Exercise[] | undefined {
  return useLiveQuery(() => exerciseRepository.list(), []);
}

/** Todos los ejercicios, también los archivados (para mostrar nombres en rutinas e historial). */
export function useAllExercises(): Exercise[] | undefined {
  return useLiveQuery(() => exerciseRepository.list({ includeArchived: true }), []);
}

/** Rutinas por orden de creación. `undefined` solo mientras responde la base por primera vez. */
export function useRoutines(): Routine[] | undefined {
  return useLiveQuery(() => routineRepository.list(), []);
}

/**
 * La rutina activa; `null` si no hay ninguna. `undefined` solo mientras responde la base.
 * (`useLiveQuery` no distingue "cargando" de un resultado `undefined`, de ahí el `null`.)
 */
export function useActiveRoutine(): Routine | null | undefined {
  return useLiveQuery(async () => (await routineRepository.getActive()) ?? null, []);
}

/** Una rutina por id; `null` si no existe. `undefined` solo mientras responde la base. */
export function useRoutine(id: string): Routine | null | undefined {
  return useLiveQuery(async () => (await routineRepository.get(id)) ?? null, [id]);
}

/** La sesión en curso; `null` si no hay. `undefined` solo mientras responde la base. */
export function useActiveSession(): WorkoutSession | null | undefined {
  return useLiveQuery(async () => (await sessionRepository.getActive()) ?? null, []);
}

/** Sesiones terminadas, la más reciente primero. */
export function useFinishedSessions(): WorkoutSession[] | undefined {
  return useLiveQuery(() => sessionRepository.listFinished(), []);
}

/** Una sesión por id; `null` si no existe. `undefined` solo mientras responde la base. */
export function useSession(id: string): WorkoutSession | null | undefined {
  return useLiveQuery(async () => (await sessionRepository.get(id)) ?? null, [id]);
}

/** Entrenos terminados guardados en el dispositivo. */
export function useWorkoutCount(): number | undefined {
  return useLiveQuery(() => backupRepository.countWorkouts(), []);
}

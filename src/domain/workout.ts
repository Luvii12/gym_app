import { createRoutineItem, REST_DEFAULT_SEC } from './routine-item';
import type { RoutineDay } from './routine';
import type { LoggedSet, SessionTarget, WorkoutSession } from './session';

/** Lo hecho la última vez con un ejercicio; sirve de punto de partida y de ayuda "Última vez". */
export interface LastPerformance {
  weightKg: number;
  reps: number;
}

export type LastPerformances = Record<string, LastPerformance>;

export const WEIGHT_STEP_KG = 2.5;
export const WEIGHT_MAX_KG = 999;
export const DEFAULT_TARGET: SessionTarget = {
  repsMin: 8,
  repsMax: 10,
  restSec: REST_DEFAULT_SEC,
};

/** Segundos aproximados de trabajo por serie para estimar la duración de un día. */
const WORK_SEC_PER_SET = 45;

/**
 * Última serie completada de cada ejercicio en las sesiones terminadas (la más reciente gana;
 * dentro de una sesión, la de mayor `setIndex`).
 */
export function lastPerformances(sessions: readonly WorkoutSession[]): LastPerformances {
  const result: LastPerformances = {};
  const finished = sessions
    .filter((s) => s.endedAt !== undefined)
    .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0));
  for (const session of finished) {
    const best = new Map<string, LoggedSet>();
    for (const set of session.sets) {
      if (set.completedAt === undefined) continue;
      const current = best.get(set.exerciseId);
      if (!current || set.setIndex > current.setIndex) best.set(set.exerciseId, set);
    }
    for (const [id, set] of best) {
      if (!(id in result)) result[id] = { weightKg: set.weightKg, reps: set.reps };
    }
  }
  return result;
}

function plannedSets(
  exerciseId: string,
  count: number,
  target: SessionTarget,
  last?: LastPerformance,
) {
  return Array.from({ length: count }, (_, setIndex): LoggedSet => ({
    exerciseId,
    setIndex,
    weightKg: last?.weightKg ?? 0,
    reps: last?.reps ?? target.repsMin,
  }));
}

export interface StartSessionInput {
  id: string;
  now: number;
  last?: LastPerformances;
  /** Sin día = entreno libre. */
  day?: RoutineDay;
  routineId?: string;
}

/** Sesión nueva con todas las series previstas, sin marcar. */
export function startSession({
  id,
  now,
  last = {},
  day,
  routineId,
}: StartSessionInput): WorkoutSession {
  const items = day?.items ?? [];
  const targets: Record<string, SessionTarget> = {};
  const sets = items.flatMap((item) => {
    const target = { repsMin: item.repsMin, repsMax: item.repsMax, restSec: item.restSec };
    targets[item.exerciseId] = target;
    return plannedSets(item.exerciseId, item.sets, target, last[item.exerciseId]);
  });
  return {
    id,
    name: day?.name ?? 'Entreno libre',
    ...(day && routineId ? { routineId, routineDayId: day.id } : {}),
    startedAt: now,
    sets,
    targets,
  };
}

/** Ids de los ejercicios en el orden de su primera aparición. */
export function exerciseOrder(session: WorkoutSession): string[] {
  return [...new Set(session.sets.map((set) => set.exerciseId))];
}

export function setsOf(session: WorkoutSession, exerciseId: string): LoggedSet[] {
  return session.sets
    .filter((set) => set.exerciseId === exerciseId)
    .sort((a, b) => a.setIndex - b.setIndex);
}

export function targetOf(session: WorkoutSession, exerciseId: string): SessionTarget {
  return session.targets?.[exerciseId] ?? DEFAULT_TARGET;
}

export function sessionProgress(session: WorkoutSession): { done: number; total: number } {
  return {
    done: session.sets.filter((set) => set.completedAt !== undefined).length,
    total: session.sets.length,
  };
}

function mapSet(
  session: WorkoutSession,
  exerciseId: string,
  setIndex: number,
  change: (set: LoggedSet) => LoggedSet,
): WorkoutSession {
  return {
    ...session,
    sets: session.sets.map((set) =>
      set.exerciseId === exerciseId && set.setIndex === setIndex ? change(set) : set,
    ),
  };
}

/** Cambia peso o repeticiones de una serie (los valores se acotan a lo razonable). */
export function updateSet(
  session: WorkoutSession,
  exerciseId: string,
  setIndex: number,
  changes: Partial<Pick<LoggedSet, 'weightKg' | 'reps'>>,
): WorkoutSession {
  return mapSet(session, exerciseId, setIndex, (set) => ({
    ...set,
    ...(changes.weightKg !== undefined
      ? { weightKg: Math.min(WEIGHT_MAX_KG, Math.max(0, changes.weightKg)) }
      : {}),
    ...(changes.reps !== undefined ? { reps: Math.max(0, Math.round(changes.reps)) } : {}),
  }));
}

/** Marca la serie como hecha, o la desmarca si ya lo estaba. */
export function toggleSet(
  session: WorkoutSession,
  exerciseId: string,
  setIndex: number,
  now: number,
): WorkoutSession {
  return mapSet(session, exerciseId, setIndex, (set) => {
    if (set.completedAt === undefined) return { ...set, completedAt: now };
    const pending = { ...set };
    delete pending.completedAt;
    return pending;
  });
}

/** Serie nueva al final del ejercicio, copiando peso y repeticiones de la anterior. */
export function addSet(session: WorkoutSession, exerciseId: string): WorkoutSession {
  const existing = setsOf(session, exerciseId);
  const previous = existing[existing.length - 1];
  if (!previous) return session;
  const added: LoggedSet = {
    exerciseId,
    setIndex: previous.setIndex + 1,
    weightKg: previous.weightKg,
    reps: previous.reps,
  };
  // Se inserta tras la última serie del ejercicio para no alterar el orden de los ejercicios.
  const at = session.sets.lastIndexOf(previous) + 1;
  return { ...session, sets: [...session.sets.slice(0, at), added, ...session.sets.slice(at)] };
}

/** Quita una serie sin hacer; las siguientes se renumeran. */
export function removeSet(
  session: WorkoutSession,
  exerciseId: string,
  setIndex: number,
): WorkoutSession {
  const own = setsOf(session, exerciseId);
  const target = own.find((set) => set.setIndex === setIndex);
  if (!target || target.completedAt !== undefined || own.length <= 1) return session;
  let next = 0;
  const renumbered = new Map(own.filter((set) => set !== target).map((set) => [set, next++]));
  return {
    ...session,
    sets: session.sets
      .filter((set) => set !== target)
      .map((set) => (renumbered.has(set) ? { ...set, setIndex: renumbered.get(set)! } : set)),
  };
}

/** Ejercicio añadido al vuelo con una serie prevista; si ya estaba, no cambia nada. */
export function addExercise(
  session: WorkoutSession,
  exerciseId: string,
  last?: LastPerformance,
): WorkoutSession {
  if (session.sets.some((set) => set.exerciseId === exerciseId)) return session;
  const item = createRoutineItem(exerciseId);
  const target = { repsMin: item.repsMin, repsMax: item.repsMax, restSec: item.restSec };
  return {
    ...session,
    sets: [...session.sets, ...plannedSets(exerciseId, 1, target, last)],
    targets: { ...session.targets, [exerciseId]: target },
  };
}

export function removeExercise(session: WorkoutSession, exerciseId: string): WorkoutSession {
  const targets = Object.fromEntries(
    Object.entries(session.targets ?? {}).filter(([id]) => id !== exerciseId),
  );
  return {
    ...session,
    sets: session.sets.filter((set) => set.exerciseId !== exerciseId),
    targets,
  };
}

/** Cierra la sesión: las series previstas que no se hicieron se descartan. */
export function finishSession(session: WorkoutSession, now: number): WorkoutSession {
  const sets = session.sets.filter((set) => set.completedAt !== undefined);
  const targets = Object.fromEntries(
    Object.entries(session.targets ?? {}).filter(([id]) => sets.some((s) => s.exerciseId === id)),
  );
  return { ...session, sets, targets, endedAt: now };
}

/** Siguiente serie sin hacer del ejercicio, si queda alguna. */
export function nextPendingSet(session: WorkoutSession, exerciseId: string): LoggedSet | undefined {
  return setsOf(session, exerciseId).find((set) => set.completedAt === undefined);
}

export interface DayPlanItem {
  exerciseId: string;
  sets: number;
  /** Peso de la última vez; `undefined` si no hay historial. */
  weightKg?: number;
}

export interface DayPlan {
  exercises: number;
  sets: number;
  estimatedMinutes: number;
  items: DayPlanItem[];
}

/** Resumen de un día para la tarjeta "Siguiente rutina". */
export function planDay(day: RoutineDay, last: LastPerformances = {}): DayPlan {
  const items = day.items.map((item): DayPlanItem => {
    const performance = last[item.exerciseId];
    return {
      exerciseId: item.exerciseId,
      sets: item.sets,
      ...(performance ? { weightKg: performance.weightKg } : {}),
    };
  });
  const sets = day.items.reduce((sum, item) => sum + item.sets, 0);
  const seconds = day.items.reduce(
    (sum, item) => sum + item.sets * (WORK_SEC_PER_SET + item.restSec),
    0,
  );
  return { exercises: day.items.length, sets, estimatedMinutes: Math.round(seconds / 60), items };
}

/** "1:02:05" o "27:26". */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Segundos que faltan para `endsAt` (0 si ya pasó). Se basa en la hora, no en ticks, para no desfasarse. */
export function restRemainingSec(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

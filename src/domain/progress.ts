import { completedSets, type LoggedSet, type WorkoutSession } from './session';

/** Un punto de la gráfica de un ejercicio: su mejor serie de una sesión. */
export interface ExercisePoint {
  sessionId: string;
  /** Inicio de la sesión. */
  at: number;
  oneRepMax: number;
  weightKg: number;
  reps: number;
}

export interface PersonalRecord {
  exerciseId: string;
  oneRepMax: number;
  weightKg: number;
  reps: number;
  achievedAt: number;
  /** 1RM ganado respecto al mejor anterior; sin valor si es el primer registro del ejercicio. */
  improvement?: number;
}

export interface WeekVolume {
  /** Lunes 00:00 (hora local) de la semana. */
  weekStart: number;
  volume: number;
  sessions: number;
}

export interface OneRepMaxChange {
  kg: number;
  percent: number;
}

const CHANGE_WINDOW_MONTHS = 3;

/** 1RM estimado con la fórmula de Epley. Con una sola repetición es el propio peso. */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

function finishedSessions(sessions: readonly WorkoutSession[]): WorkoutSession[] {
  return sessions.filter((s) => s.endedAt !== undefined);
}

/** Volumen de una sesión: suma de peso × repeticiones de las series hechas. */
export function sessionVolume(session: WorkoutSession): number {
  return completedSets(session).reduce((total, set) => total + set.weightKg * set.reps, 0);
}

/** Lunes 00:00 (hora local) de la semana que contiene el instante dado. */
export function startOfWeek(timestamp: number): number {
  const date = new Date(timestamp);
  const sinceMonday = (date.getDay() + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - sinceMonday).getTime();
}

function nextWeek(weekStart: number): number {
  const date = new Date(weekStart);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7).getTime();
}

function previousWeek(weekStart: number): number {
  const date = new Date(weekStart);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7).getTime();
}

/** Mejor serie (por 1RM) de cada sesión terminada que incluya el ejercicio, en orden cronológico. */
export function exerciseHistory(
  sessions: readonly WorkoutSession[],
  exerciseId: string,
): ExercisePoint[] {
  const points: ExercisePoint[] = [];
  for (const session of finishedSessions(sessions)) {
    let best: ExercisePoint | undefined;
    for (const set of completedSets(session)) {
      if (set.exerciseId !== exerciseId) continue;
      const oneRepMax = estimateOneRepMax(set.weightKg, set.reps);
      if (oneRepMax > 0 && (!best || oneRepMax > best.oneRepMax)) {
        best = {
          sessionId: session.id,
          at: session.startedAt,
          oneRepMax,
          weightKg: set.weightKg,
          reps: set.reps,
        };
      }
    }
    if (best) points.push(best);
  }
  return points.sort((a, b) => a.at - b.at);
}

/** Récord actual de cada ejercicio con historial (si dos sesiones lo igualan, cuenta la primera). */
export function personalRecords(sessions: readonly WorkoutSession[]): PersonalRecord[] {
  const ids = new Set<string>();
  for (const session of finishedSessions(sessions)) {
    for (const set of completedSets(session)) ids.add(set.exerciseId);
  }
  const records: PersonalRecord[] = [];
  for (const exerciseId of ids) {
    let record: PersonalRecord | undefined;
    for (const point of exerciseHistory(sessions, exerciseId)) {
      if (record && point.oneRepMax <= record.oneRepMax) continue;
      record = {
        exerciseId,
        oneRepMax: point.oneRepMax,
        weightKg: point.weightKg,
        reps: point.reps,
        achievedAt: point.at,
        ...(record ? { improvement: point.oneRepMax - record.oneRepMax } : {}),
      };
    }
    if (record) records.push(record);
  }
  return records;
}

/** ¿La serie supera el mejor 1RM anterior del ejercicio? La primera vez no cuenta como récord. */
export function isNewRecord(history: readonly WorkoutSession[], set: LoggedSet): boolean {
  const oneRepMax = estimateOneRepMax(set.weightKg, set.reps);
  if (oneRepMax <= 0) return false;
  const previous = exerciseHistory(history, set.exerciseId);
  if (previous.length === 0) return false;
  return oneRepMax > Math.max(...previous.map((p) => p.oneRepMax));
}

/**
 * Variación del mejor 1RM actual frente al mejor que había hace 3 meses.
 * Sin datos anteriores a esa fecha no hay con qué comparar.
 */
export function oneRepMaxChange(
  points: readonly Pick<ExercisePoint, 'at' | 'oneRepMax'>[],
  now: number,
): OneRepMaxChange | undefined {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - CHANGE_WINDOW_MONTHS);
  const before = points.filter((p) => p.at <= cutoff.getTime());
  if (before.length === 0) return undefined;
  const baseline = Math.max(...before.map((p) => p.oneRepMax));
  const current = Math.max(...points.map((p) => p.oneRepMax));
  return { kg: current - baseline, percent: ((current - baseline) / baseline) * 100 };
}

/** Volumen por semana, desde la primera sesión hasta la semana actual (las vacías, a 0). */
export function weeklyVolume(sessions: readonly WorkoutSession[], now: number): WeekVolume[] {
  const finished = finishedSessions(sessions);
  if (finished.length === 0) return [];
  const byWeek = new Map<number, WeekVolume>();
  for (const session of finished) {
    const weekStart = startOfWeek(session.startedAt);
    const week = byWeek.get(weekStart) ?? { weekStart, volume: 0, sessions: 0 };
    week.volume += sessionVolume(session);
    week.sessions += 1;
    byWeek.set(weekStart, week);
  }
  const first = Math.min(...byWeek.keys());
  const last = Math.max(startOfWeek(now), ...byWeek.keys());
  const weeks: WeekVolume[] = [];
  for (let weekStart = first; weekStart <= last; weekStart = nextWeek(weekStart)) {
    weeks.push(byWeek.get(weekStart) ?? { weekStart, volume: 0, sessions: 0 });
  }
  return weeks;
}

/**
 * Semanas seguidas con al menos `daysPerWeek` entrenos. La semana en curso suma si ya cumple,
 * pero si aún no cumple no rompe la racha.
 */
export function weekStreak(
  sessions: readonly WorkoutSession[],
  daysPerWeek: number,
  now: number,
): number {
  const counts = new Map<number, number>();
  for (const session of finishedSessions(sessions)) {
    if (completedSets(session).length === 0) continue;
    const weekStart = startOfWeek(session.startedAt);
    counts.set(weekStart, (counts.get(weekStart) ?? 0) + 1);
  }
  const meets = (weekStart: number) => (counts.get(weekStart) ?? 0) >= daysPerWeek;
  let week = startOfWeek(now);
  if (!meets(week)) week = previousWeek(week);
  let streak = 0;
  while (meets(week)) {
    streak += 1;
    week = previousWeek(week);
  }
  return streak;
}

/** Días naturales (hora local) entre un instante y `now`; 0 = hoy. */
export function daysSince(timestamp: number, now: number): number {
  const a = new Date(timestamp);
  const b = new Date(now);
  const dayA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const dayB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.max(0, Math.round((dayB - dayA) / 86_400_000));
}

/**
 * Récords que batió una sesión: ejercicios cuyo mejor 1RM de esa sesión supera todo lo anterior.
 * El primer registro de un ejercicio no cuenta. Ordenados por mejora, de mayor a menor.
 */
export function sessionRecords(
  sessions: readonly WorkoutSession[],
  session: WorkoutSession,
): (ExercisePoint & { exerciseId: string; improvement: number })[] {
  const records: (ExercisePoint & { exerciseId: string; improvement: number })[] = [];
  const ids = new Set(completedSets(session).map((set) => set.exerciseId));
  for (const exerciseId of ids) {
    const points = exerciseHistory(sessions, exerciseId);
    const own = points.find((p) => p.sessionId === session.id);
    if (!own) continue;
    const before = points.filter((p) => p.at < own.at || (p.at === own.at && p !== own));
    if (before.length === 0) continue;
    const improvement = own.oneRepMax - Math.max(...before.map((p) => p.oneRepMax));
    if (improvement > 0) records.push({ ...own, exerciseId, improvement });
  }
  return records.sort((a, b) => b.improvement - a.improvement);
}

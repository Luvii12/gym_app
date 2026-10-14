import { EQUIPMENT, MUSCLE_GROUPS, type Exercise } from './exercise';
import type { Routine, RoutineDay, RoutineItem } from './routine';
import type { LoggedSet, SessionTarget, WorkoutSession } from './session';

export const BACKUP_FORMAT = 'gym-routine-backup';
export const BACKUP_VERSION = 1;

export type SettingValue = string | number | boolean | null;
export interface BackupSetting {
  key: string;
  value: SettingValue;
}

/** Copia de seguridad completa y autocontenida: todo lo que hay en el dispositivo. */
export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: number;
  /** Solo los propios; el catálogo semilla se vuelve a cargar en cada arranque. */
  exercises: Exercise[];
  routines: Routine[];
  sessions: WorkoutSession[];
  settings: BackupSetting[];
}

export interface BackupData {
  exercises: Exercise[];
  routines: Routine[];
  sessions: WorkoutSession[];
  settings: BackupSetting[];
}

export type ParseResult = { ok: true; backup: Backup } | { ok: false; error: string };

export interface BackupSummary {
  workouts: number;
  routines: number;
  customExercises: number;
}

export function buildBackup(data: BackupData, now: number): Backup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now,
    exercises: data.exercises.filter((e) => e.isCustom),
    routines: data.routines,
    sessions: data.sessions,
    settings: data.settings,
  };
}

export function summarizeBackup(backup: Backup): BackupSummary {
  return {
    workouts: backup.sessions.filter((s) => s.endedAt !== undefined).length,
    routines: backup.routines.length,
    customExercises: backup.exercises.length,
  };
}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isNonNeg = (v: unknown): v is number => isNum(v) && v >= 0;
const optional = <T>(v: unknown, check: (x: unknown) => x is T): boolean =>
  v === undefined || check(v);

function isTarget(v: unknown): v is SessionTarget {
  return isObj(v) && isNonNeg(v.repsMin) && isNonNeg(v.repsMax) && isNonNeg(v.restSec);
}

function isLoggedSet(v: unknown): v is LoggedSet {
  return (
    isObj(v) &&
    isStr(v.exerciseId) &&
    isNonNeg(v.setIndex) &&
    isNonNeg(v.weightKg) &&
    isNonNeg(v.reps) &&
    optional(v.completedAt, isNum)
  );
}

function isSession(v: unknown): v is WorkoutSession {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.name) &&
    optional(v.routineId, isStr) &&
    optional(v.routineDayId, isStr) &&
    isNum(v.startedAt) &&
    optional(v.endedAt, isNum) &&
    Array.isArray(v.sets) &&
    v.sets.every(isLoggedSet) &&
    optional(
      v.targets,
      (t): t is Record<string, SessionTarget> => isObj(t) && Object.values(t).every(isTarget),
    )
  );
}

function isItem(v: unknown): v is RoutineItem {
  return (
    isObj(v) &&
    isStr(v.exerciseId) &&
    isNonNeg(v.sets) &&
    isNonNeg(v.repsMin) &&
    isNonNeg(v.repsMax) &&
    isNonNeg(v.restSec)
  );
}

function isDay(v: unknown): v is RoutineDay {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.name) &&
    (v.kind === 'training' || v.kind === 'rest') &&
    Array.isArray(v.items) &&
    v.items.every(isItem) &&
    optional(v.note, isStr)
  );
}

function isRoutine(v: unknown): v is Routine {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.name) &&
    optional(v.description, isStr) &&
    isNum(v.daysPerWeek) &&
    v.daysPerWeek >= 1 &&
    v.daysPerWeek <= 7 &&
    Array.isArray(v.days) &&
    v.days.every(isDay) &&
    isNum(v.createdAt)
  );
}

function isExercise(v: unknown): v is Exercise {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.name) &&
    (MUSCLE_GROUPS as readonly unknown[]).includes(v.muscleGroup) &&
    (EQUIPMENT as readonly unknown[]).includes(v.equipment) &&
    optional(v.muscles, isStr) &&
    typeof v.isCustom === 'boolean' &&
    optional(v.archivedAt, isNum)
  );
}

function isSetting(v: unknown): v is BackupSetting {
  return (
    isObj(v) &&
    isStr(v.key) &&
    (v.value === null || isStr(v.value) || isNum(v.value) || typeof v.value === 'boolean')
  );
}

function listOf<T>(value: unknown, check: (x: unknown) => x is T): value is T[] {
  return Array.isArray(value) && value.every(check);
}

/** Valida un JSON importado. No confía en nada: o es una copia íntegra de esta app, o se rechaza. */
export function parseBackup(input: unknown): ParseResult {
  if (!isObj(input) || input.format !== BACKUP_FORMAT) {
    return { ok: false, error: 'El archivo no es una copia de seguridad de Gym Routine.' };
  }
  if (!isNum(input.version) || input.version < 1) {
    return { ok: false, error: 'La copia no indica una versión válida.' };
  }
  if (input.version > BACKUP_VERSION) {
    return {
      ok: false,
      error: 'La copia es de una versión más nueva de la app. Actualiza la app.',
    };
  }
  if (!isNum(input.exportedAt))
    return { ok: false, error: 'La copia no tiene fecha de exportación.' };
  const checks: [string, boolean][] = [
    ['ejercicios', listOf(input.exercises, isExercise)],
    ['rutinas', listOf(input.routines, isRoutine)],
    ['entrenos', listOf(input.sessions, isSession)],
    ['ajustes', listOf(input.settings, isSetting)],
  ];
  const broken = checks.find(([, valid]) => !valid);
  if (broken) return { ok: false, error: `La copia está dañada: revisa los ${broken[0]}.` };
  return {
    ok: true,
    backup: {
      format: BACKUP_FORMAT,
      version: input.version,
      exportedAt: input.exportedAt,
      exercises: input.exercises as Exercise[],
      routines: input.routines as Routine[],
      sessions: input.sessions as WorkoutSession[],
      settings: input.settings as BackupSetting[],
    },
  };
}

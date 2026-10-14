import type { RoutineItem } from './routine';

export const SETS_MIN = 1;
export const SETS_MAX = 10;
export const SETS_DEFAULT = 3;
export const REPS_MIN = 1;
export const REPS_MAX = 100;
export const REPS_MIN_DEFAULT = 8;
export const REPS_MAX_DEFAULT = 10;
export const REST_MIN_SEC = 0;
export const REST_MAX_SEC = 600;
export const REST_STEP_SEC = 15;
export const REST_DEFAULT_SEC = 90;

/** Entero dentro de [min, max]; un valor no numérico cae en `min`. */
export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function createRoutineItem(exerciseId: string): RoutineItem {
  return {
    exerciseId,
    sets: SETS_DEFAULT,
    repsMin: REPS_MIN_DEFAULT,
    repsMax: REPS_MAX_DEFAULT,
    restSec: REST_DEFAULT_SEC,
  };
}

/** Mensaje de error del rango de repeticiones, o `null` si es válido. */
export function validateRepRange(repsMin: number, repsMax: number): string | null {
  const valid = (n: number) => Number.isInteger(n) && n >= REPS_MIN && n <= REPS_MAX;
  if (!valid(repsMin) || !valid(repsMax)) {
    return `Usa números enteros entre ${REPS_MIN} y ${REPS_MAX}.`;
  }
  if (repsMin > repsMax) return 'El mínimo no puede ser mayor que el máximo.';
  return null;
}

/** "1:30", "0:45", "10:00". */
export function formatRest(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const rest = total % 60;
  return `${Math.floor(total / 60)}:${rest < 10 ? '0' : ''}${rest}`;
}

/** Añade al final los ejercicios que aún no estén en la lista (sin duplicar). */
export function addExercisesToItems(
  items: readonly RoutineItem[],
  exerciseIds: readonly string[],
): RoutineItem[] {
  const present = new Set(items.map((item) => item.exerciseId));
  const added: RoutineItem[] = [];
  for (const id of exerciseIds) {
    if (present.has(id)) continue;
    present.add(id);
    added.push(createRoutineItem(id));
  }
  return [...items, ...added];
}

/** Inserta en `index` (acotado) salvo que el ejercicio ya esté. */
export function insertItem(
  items: readonly RoutineItem[],
  item: RoutineItem,
  index: number,
): RoutineItem[] {
  if (items.some((existing) => existing.exerciseId === item.exerciseId)) return [...items];
  const at = clampInt(index, 0, items.length);
  return [...items.slice(0, at), item, ...items.slice(at)];
}

export function removeItem(items: readonly RoutineItem[], exerciseId: string): RoutineItem[] {
  return items.filter((item) => item.exerciseId !== exerciseId);
}

/** Mueve el elemento de `from` a `to`; índices fuera de rango dejan la lista igual. */
export function moveItem(items: readonly RoutineItem[], from: number, to: number): RoutineItem[] {
  const next = [...items];
  if (from === to || from < 0 || to < 0 || from >= next.length || to >= next.length) return next;
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

export function updateItem(
  items: readonly RoutineItem[],
  exerciseId: string,
  changes: Partial<Omit<RoutineItem, 'exerciseId'>>,
): RoutineItem[] {
  return items.map((item) => (item.exerciseId === exerciseId ? { ...item, ...changes } : item));
}

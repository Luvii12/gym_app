export interface RoutineItem {
  exerciseId: string;
  sets: number;
  /** Rango de repeticiones objetivo (8-10). */
  repsMin: number;
  repsMax: number;
  restSec: number;
}

export type RoutineDayKind = 'training' | 'rest';

export interface RoutineDay {
  id: string;
  name: string;
  /** `rest` = descanso activo: no cuenta en la rotación de `nextDay`. */
  kind: RoutineDayKind;
  /** Vacío en los días de descanso. */
  items: RoutineItem[];
  /** Solo en descanso activo: "Cardio suave o movilidad · 30 min". */
  note?: string;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  /** Sesiones de entreno previstas por semana; base de la racha. */
  daysPerWeek: number;
  /** Orden de rotación. */
  days: RoutineDay[];
  createdAt: number;
}

/** "8-10", o "12" si el rango es de un solo valor. */
export function formatRepRange(repsMin: number, repsMax: number): string {
  return repsMin === repsMax ? String(repsMin) : `${repsMin}-${repsMax}`;
}

export function isRestDay(day: RoutineDay): boolean {
  return day.kind === 'rest';
}

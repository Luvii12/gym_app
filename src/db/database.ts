import Dexie, { type EntityTable } from 'dexie';
import type { Exercise, Routine, WorkoutSession } from '../domain';

/** Ajustes sueltos clave-valor, p. ej. `activeRoutineId`. */
export interface Setting {
  key: string;
  value: string | number | boolean | null;
}

/**
 * Única puerta a IndexedDB: nada fuera de `src/db/` debe importar Dexie.
 *
 * Los índices se declaran con la versión. Para cambiar el esquema NO se edita la versión 1:
 * se añade `this.version(2).stores({...})` (+ `.upgrade()` si hay que transformar datos).
 * IndexedDB no admite booleanos como clave, así que `isCustom` no se indexa.
 */
export class GymDatabase extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  routines!: EntityTable<Routine, 'id'>;
  sessions!: EntityTable<WorkoutSession, 'id'>;
  settings!: EntityTable<Setting, 'key'>;

  constructor(name = 'gym-routine') {
    super(name);
    this.version(1).stores({
      exercises: 'id, muscleGroup',
      routines: 'id, createdAt',
      sessions: 'id, startedAt, endedAt, routineId',
      settings: 'key',
    });
  }
}

export const db = new GymDatabase();

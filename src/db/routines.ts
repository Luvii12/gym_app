import type { Routine } from '../domain';
import { db, type GymDatabase } from './database';
import { RepositoryError } from './errors';

const ACTIVE_KEY = 'activeRoutineId';

/** Datos que aporta el usuario al crear una rutina; el resto tiene valores por defecto. */
export interface NewRoutine {
  name: string;
  description?: string;
  /** Por defecto 3. */
  daysPerWeek?: number;
  days?: Routine['days'];
}

export type RoutineChanges = Partial<Omit<Routine, 'id' | 'createdAt'>>;

/** Recorta los textos; una descripción vacía se quita. */
function tidy<T extends { name?: string; description?: string }>(input: T): T {
  const result = { ...input };
  if (input.name !== undefined) result.name = input.name.trim();
  if (input.description !== undefined) result.description = input.description.trim();
  return result;
}

function assertValid(routine: { name?: string; daysPerWeek?: number }) {
  if (routine.name !== undefined && routine.name === '') {
    throw new RepositoryError('invalid', 'La rutina necesita un nombre');
  }
  const perWeek = routine.daysPerWeek;
  if (perWeek !== undefined && (!Number.isInteger(perWeek) || perWeek < 1 || perWeek > 7)) {
    throw new RepositoryError('invalid', 'Los días por semana deben ser de 1 a 7');
  }
}

export function createRoutineRepository(database: GymDatabase) {
  const table = database.routines;
  const settings = database.settings;

  async function activeId(): Promise<string | null> {
    const setting = await settings.get(ACTIVE_KEY);
    return typeof setting?.value === 'string' ? setting.value : null;
  }

  async function mustGet(id: string): Promise<Routine> {
    const routine = await table.get(id);
    if (!routine) throw new RepositoryError('not-found', `No existe la rutina ${id}`);
    return routine;
  }

  return {
    /** Rutinas por orden de creación. */
    async list(): Promise<Routine[]> {
      return table.orderBy('createdAt').toArray();
    },

    get(id: string): Promise<Routine | undefined> {
      return table.get(id);
    },

    /** La primera rutina que se crea pasa a ser la activa. */
    create(input: NewRoutine): Promise<Routine> {
      return database.transaction('rw', [table, settings], async () => {
        const draft = tidy(input);
        assertValid(draft);
        const { days = [], daysPerWeek = 3, description, ...rest } = draft;
        const routine: Routine = {
          ...rest,
          ...(description ? { description } : {}),
          id: crypto.randomUUID(),
          daysPerWeek,
          days,
          createdAt: Date.now(),
        };
        await table.add(routine);
        const current = await activeId();
        if (current === null || !(await table.get(current))) {
          await settings.put({ key: ACTIVE_KEY, value: routine.id });
        }
        return routine;
      });
    },

    /** Renombrar, cambiar días por semana o reemplazar los días. */
    update(id: string, changes: RoutineChanges): Promise<Routine> {
      return database.transaction('rw', table, async () => {
        const existing = await mustGet(id);
        const draft = tidy(changes);
        assertValid(draft);
        const merged: Routine = { ...existing, ...draft, id, createdAt: existing.createdAt };
        if (!merged.description) delete merged.description;
        await table.put(merged);
        return merged;
      });
    },

    /** Copia con ids nuevos, "(copia)" en el nombre. No se activa. */
    duplicate(id: string): Promise<Routine> {
      return database.transaction('rw', table, async () => {
        const original = await mustGet(id);
        const copy: Routine = {
          ...original,
          id: crypto.randomUUID(),
          name: `${original.name} (copia)`,
          createdAt: Date.now(),
          days: original.days.map((day) => ({
            ...day,
            id: crypto.randomUUID(),
            items: day.items.map((item) => ({ ...item })),
          })),
        };
        await table.add(copy);
        return copy;
      });
    },

    /**
     * Borra la rutina. Las sesiones guardadas no se tocan (llevan su propio nombre).
     * Si era la activa, pasa a serlo la más antigua de las que quedan.
     */
    remove(id: string): Promise<void> {
      return database.transaction('rw', [table, settings], async () => {
        await mustGet(id);
        await table.delete(id);
        if ((await activeId()) === id) {
          const next = await table.orderBy('createdAt').first();
          await settings.put({ key: ACTIVE_KEY, value: next?.id ?? null });
        }
      });
    },

    /** La rutina activa, o `undefined` si no hay ninguna (o la guardada ya no existe). */
    async getActive(): Promise<Routine | undefined> {
      const id = await activeId();
      return id === null ? undefined : table.get(id);
    },

    setActive(id: string): Promise<void> {
      return database.transaction('rw', [table, settings], async () => {
        await mustGet(id);
        await settings.put({ key: ACTIVE_KEY, value: id });
      });
    },
  };
}

export type RoutineRepository = ReturnType<typeof createRoutineRepository>;

export const routineRepository = createRoutineRepository(db);

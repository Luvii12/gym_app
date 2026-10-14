import type { Exercise } from '../domain';
import { db, type GymDatabase } from './database';
import { RepositoryError } from './errors';

export { RepositoryError } from './errors';

/** Datos que aporta el usuario al crear o editar un ejercicio propio. */
export type NewExercise = Omit<Exercise, 'id' | 'isCustom'>;
/** Entrada de la semilla: ya trae su id estable. */
export type SeedExercise = Omit<Exercise, 'isCustom'>;

function cleanName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed)
    throw new RepositoryError('invalid', 'El nombre del ejercicio no puede estar vacío');
  return trimmed;
}

function sameContent(a: SeedExercise, b: SeedExercise): boolean {
  return (
    a.name === b.name &&
    a.muscleGroup === b.muscleGroup &&
    a.muscles === b.muscles &&
    a.equipment === b.equipment
  );
}

export function createExerciseRepository(database: GymDatabase) {
  const table = database.exercises;

  return {
    /** Todos los ejercicios, ordenados por nombre. */
    async list(): Promise<Exercise[]> {
      const all = await table.toArray();
      return all.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    },

    get(id: string): Promise<Exercise | undefined> {
      return table.get(id);
    },

    count(): Promise<number> {
      return table.count();
    },

    async create(input: NewExercise): Promise<Exercise> {
      const exercise: Exercise = {
        ...input,
        id: crypto.randomUUID(),
        name: cleanName(input.name),
        isCustom: true,
      };
      await table.add(exercise);
      return exercise;
    },

    /** Solo los ejercicios propios se pueden editar. */
    update(id: string, changes: Partial<NewExercise>): Promise<Exercise> {
      return database.transaction('rw', table, async () => {
        const existing = await table.get(id);
        if (!existing) throw new RepositoryError('not-found', `No existe el ejercicio ${id}`);
        if (!existing.isCustom) {
          throw new RepositoryError(
            'forbidden',
            'Los ejercicios predeterminados no se pueden editar',
          );
        }
        const updated: Exercise = {
          ...existing,
          ...changes,
          name: changes.name === undefined ? existing.name : cleanName(changes.name),
        };
        await table.put(updated);
        return updated;
      });
    },

    /** Solo los ejercicios propios se pueden borrar. */
    remove(id: string): Promise<void> {
      return database.transaction('rw', table, async () => {
        const existing = await table.get(id);
        if (!existing) throw new RepositoryError('not-found', `No existe el ejercicio ${id}`);
        if (!existing.isCustom) {
          throw new RepositoryError(
            'forbidden',
            'Los ejercicios predeterminados no se pueden borrar',
          );
        }
        await table.delete(id);
      });
    },

    /**
     * Carga el catálogo semilla. Idempotente: añade lo que falta y actualiza los
     * predeterminados cuyo contenido cambió. Nunca toca los ejercicios propios.
     */
    seed(items: SeedExercise[]): Promise<{ added: number; updated: number }> {
      return database.transaction('rw', table, async () => {
        let added = 0;
        let updated = 0;
        for (const item of items) {
          const existing = await table.get(item.id);
          if (existing?.isCustom) continue;
          if (!existing) added++;
          else if (!sameContent(existing, item)) updated++;
          else continue;
          await table.put({ ...item, isCustom: false });
        }
        return { added, updated };
      });
    },
  };
}

export type ExerciseRepository = ReturnType<typeof createExerciseRepository>;

export const exerciseRepository = createExerciseRepository(db);

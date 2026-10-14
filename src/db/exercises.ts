import { validateExerciseDraft, type Exercise, type SeedExercise } from '../domain';
import { db, type GymDatabase } from './database';
import { RepositoryError } from './errors';

export { RepositoryError } from './errors';
export type { SeedExercise } from '../domain';

/** Datos que aporta el usuario al crear o editar un ejercicio propio. */
export type NewExercise = Omit<Exercise, 'id' | 'isCustom' | 'archivedAt'>;

/** `archived`: el ejercicio estaba en una rutina o en el historial y se conserva, oculto. */
export type RemoveResult = 'deleted' | 'archived';

function sameContent(a: SeedExercise, b: SeedExercise): boolean {
  return (
    a.name === b.name &&
    a.muscleGroup === b.muscleGroup &&
    a.muscles === b.muscles &&
    a.equipment === b.equipment
  );
}

/** Recorta los textos y omite `muscles` si queda vacío. */
function tidy(input: NewExercise): NewExercise {
  const { muscles, ...rest } = input;
  const trimmed = muscles?.trim();
  return { ...rest, name: input.name.trim(), ...(trimmed ? { muscles: trimmed } : {}) };
}

function assertValid(draft: NewExercise, existing: readonly Exercise[], editingId?: string) {
  const errors = validateExerciseDraft(draft, existing, editingId);
  if (errors.name === 'duplicate') {
    throw new RepositoryError('duplicate', 'Ya existe un ejercicio con ese nombre');
  }
  if (Object.keys(errors).length > 0) {
    throw new RepositoryError('invalid', `Ejercicio no válido: ${Object.keys(errors).join(', ')}`);
  }
}

export function createExerciseRepository(database: GymDatabase) {
  const table = database.exercises;

  async function visible(): Promise<Exercise[]> {
    const all = await table.toArray();
    return all.filter((e) => !e.archivedAt);
  }

  async function isInUse(id: string): Promise<boolean> {
    const inRoutines = await database.routines
      .filter((r) => r.days.some((d) => d.items.some((i) => i.exerciseId === id)))
      .count();
    if (inRoutines > 0) return true;
    const inSessions = await database.sessions
      .filter((s) => s.sets.some((set) => set.exerciseId === id))
      .count();
    return inSessions > 0;
  }

  return {
    /** Ejercicios ordenados por nombre. Los archivados solo salen si se piden. */
    async list({ includeArchived = false }: { includeArchived?: boolean } = {}): Promise<
      Exercise[]
    > {
      const all = includeArchived ? await table.toArray() : await visible();
      return all.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    },

    /** También devuelve los archivados: el historial necesita su nombre. */
    get(id: string): Promise<Exercise | undefined> {
      return table.get(id);
    },

    /** Número de ejercicios visibles en el catálogo. */
    async count(): Promise<number> {
      return (await visible()).length;
    },

    create(input: NewExercise): Promise<Exercise> {
      return database.transaction('rw', table, async () => {
        const draft = tidy(input);
        assertValid(draft, await visible());
        const exercise: Exercise = { ...draft, id: crypto.randomUUID(), isCustom: true };
        await table.add(exercise);
        return exercise;
      });
    },

    /** Solo los ejercicios propios se pueden editar. */
    update(id: string, changes: Partial<NewExercise>): Promise<Exercise> {
      return database.transaction('rw', table, async () => {
        const existing = await table.get(id);
        if (!existing || existing.archivedAt) {
          throw new RepositoryError('not-found', `No existe el ejercicio ${id}`);
        }
        if (!existing.isCustom) {
          throw new RepositoryError(
            'forbidden',
            'Los ejercicios predeterminados no se pueden editar',
          );
        }
        const draft = tidy({ ...existing, ...changes });
        assertValid(draft, await visible(), id);
        const updated: Exercise = { ...draft, id, isCustom: true };
        await table.put(updated);
        return updated;
      });
    },

    /**
     * Quita un ejercicio propio del catálogo. Si ya está en una rutina o en el historial se
     * archiva (no se pierde el historial); si no se usa en ningún sitio, se borra de verdad.
     */
    remove(id: string): Promise<RemoveResult> {
      return database.transaction('rw', [table, database.routines, database.sessions], async () => {
        const existing = await table.get(id);
        if (!existing || existing.archivedAt) {
          throw new RepositoryError('not-found', `No existe el ejercicio ${id}`);
        }
        if (!existing.isCustom) {
          throw new RepositoryError(
            'forbidden',
            'Los ejercicios predeterminados no se pueden borrar',
          );
        }
        if (await isInUse(id)) {
          await table.put({ ...existing, archivedAt: Date.now() });
          return 'archived';
        }
        await table.delete(id);
        return 'deleted';
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

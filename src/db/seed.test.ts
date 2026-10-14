import { SEED_EXERCISES } from '../data/exercises';
import { GymDatabase } from './database';
import { createExerciseRepository } from './exercises';
import { seedCatalog } from './seed';

let db: GymDatabase;
let repo: ReturnType<typeof createExerciseRepository>;

beforeEach(() => {
  db = new GymDatabase(`test-${crypto.randomUUID()}`);
  repo = createExerciseRepository(db);
});

afterEach(async () => {
  await db.delete();
});

describe('seedCatalog', () => {
  it('carga todo el catálogo en el primer arranque, como predeterminado', async () => {
    const result = await seedCatalog(repo);
    expect(result).toEqual({ added: SEED_EXERCISES.length, updated: 0 });
    expect(await repo.count()).toBe(SEED_EXERCISES.length);
    expect((await repo.list()).every((e) => e.isCustom === false)).toBe(true);
  });

  it('es idempotente: arrancar varias veces no duplica ni cambia nada', async () => {
    await seedCatalog(repo);
    expect(await seedCatalog(repo)).toEqual({ added: 0, updated: 0 });
    expect(await repo.count()).toBe(SEED_EXERCISES.length);
  });

  it('respeta los ejercicios propios', async () => {
    const mine = await repo.create({
      name: 'Mi ejercicio',
      muscleGroup: 'core',
      equipment: 'other',
    });
    await seedCatalog(repo);
    expect(await repo.get(mine.id)).toEqual(mine);
    expect(await repo.count()).toBe(SEED_EXERCISES.length + 1);
  });
});

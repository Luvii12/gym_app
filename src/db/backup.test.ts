import { buildBackup, type Exercise, type Routine, type WorkoutSession } from '../domain';
import { createBackupRepository } from './backup';
import { GymDatabase } from './database';

let db: GymDatabase;
let repo: ReturnType<typeof createBackupRepository>;

beforeEach(() => {
  db = new GymDatabase(`test-${crypto.randomUUID()}`);
  repo = createBackupRepository(db);
});

afterEach(async () => {
  await db.delete();
});

const seed: Exercise = {
  id: 'barbell-bench-press',
  name: 'Press banca',
  muscleGroup: 'chest',
  equipment: 'barbell',
  isCustom: false,
};
const custom: Exercise = { ...seed, id: 'c1', name: 'Mi ejercicio', isCustom: true };
const routine: Routine = { id: 'r1', name: 'PPL', daysPerWeek: 3, days: [], createdAt: 1 };
const done: WorkoutSession = { id: 's1', name: 'Push', startedAt: 1, endedAt: 2, sets: [] };
const active: WorkoutSession = { id: 's2', name: 'Pull', startedAt: 3, sets: [] };

async function fill() {
  await db.exercises.bulkPut([seed, custom]);
  await db.routines.put(routine);
  await db.sessions.bulkPut([done, active]);
  await db.settings.put({ key: 'activeRoutineId', value: 'r1' });
}

describe('backupRepository', () => {
  it('exporta e importa sin pérdidas', async () => {
    await fill();
    const backup = await repo.export(10);
    await repo.clearAll();
    await repo.import(backup);
    expect(await repo.export(10)).toEqual(backup);
  });

  it('importar sustituye lo que había y conserva el catálogo semilla', async () => {
    await fill();
    const other = buildBackup(
      { exercises: [], routines: [], sessions: [{ ...done, id: 'x' }], settings: [] },
      1,
    );
    await repo.import(other);
    expect((await db.sessions.toArray()).map((s) => s.id)).toEqual(['x']);
    expect(await db.routines.count()).toBe(0);
    expect((await db.exercises.toArray()).map((e) => e.id)).toEqual([seed.id]);
  });

  it('el export no incluye ejercicios de la semilla', async () => {
    await fill();
    expect((await repo.export()).exercises.map((e) => e.id)).toEqual(['c1']);
  });

  it('clearAll borra todo salvo la semilla', async () => {
    await fill();
    await repo.clearAll();
    expect(await db.sessions.count()).toBe(0);
    expect(await db.routines.count()).toBe(0);
    expect(await db.settings.count()).toBe(0);
    expect((await db.exercises.toArray()).map((e) => e.id)).toEqual([seed.id]);
  });

  it('countWorkouts no cuenta la sesión en curso', async () => {
    await fill();
    expect(await repo.countWorkouts()).toBe(1);
  });
});

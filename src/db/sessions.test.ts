import type { WorkoutSession } from '../domain';
import { GymDatabase } from './database';
import { RepositoryError } from './errors';
import { createSessionRepository } from './sessions';

let db: GymDatabase;
let repo: ReturnType<typeof createSessionRepository>;

beforeEach(() => {
  db = new GymDatabase(`test-${crypto.randomUUID()}`);
  repo = createSessionRepository(db);
});

afterEach(async () => {
  await db.delete();
});

const session = (id: string, overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id,
  name: 'Push',
  startedAt: 1000,
  sets: [],
  ...overrides,
});

describe('sessionRepository', () => {
  it('guarda y recupera la sesión en curso con sus series', async () => {
    const s = session('a', { sets: [{ exerciseId: 'bench', setIndex: 0, weightKg: 80, reps: 8 }] });
    await repo.save(s);
    expect(await repo.getActive()).toEqual(s);
  });

  it('save sobrescribe la misma sesión (cada serie se guarda al momento)', async () => {
    await repo.save(session('a'));
    await repo.save(session('a', { name: 'Push A' }));
    expect((await repo.getActive())?.name).toBe('Push A');
  });

  it('no admite dos sesiones en curso a la vez', async () => {
    await repo.save(session('a'));
    await expect(repo.save(session('b', { startedAt: 2000 }))).rejects.toBeInstanceOf(
      RepositoryError,
    );
  });

  it('una sesión terminada deja de ser la activa y sale en el historial, la más reciente primero', async () => {
    await repo.save(session('old', { startedAt: 1, endedAt: 2 }));
    await repo.save(session('new', { startedAt: 10, endedAt: 20 }));
    await repo.save(session('live', { startedAt: 30 }));
    expect((await repo.getActive())?.id).toBe('live');
    expect((await repo.listFinished()).map((s) => s.id)).toEqual(['new', 'old']);
  });

  it('remove descarta la sesión', async () => {
    await repo.save(session('a'));
    await repo.remove('a');
    expect(await repo.getActive()).toBeUndefined();
  });
});

import type { RoutineDay } from '../domain';
import { GymDatabase } from './database';
import { RepositoryError } from './errors';
import { createRoutineRepository } from './routines';

let db: GymDatabase;
let repo: ReturnType<typeof createRoutineRepository>;

beforeEach(() => {
  db = new GymDatabase(`test-${crypto.randomUUID()}`);
  repo = createRoutineRepository(db);
});

afterEach(async () => {
  await db.delete();
});

async function failure(promise: Promise<unknown>): Promise<RepositoryError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(RepositoryError);
    return error as RepositoryError;
  }
  throw new Error('Se esperaba un error y no se produjo');
}

const push: RoutineDay = {
  id: 'push',
  name: 'Push',
  kind: 'training',
  items: [{ exerciseId: 'bench', sets: 3, repsMin: 8, repsMax: 10, restSec: 90 }],
};

describe('create', () => {
  it('crea con valores por defecto y recorta el nombre', async () => {
    const routine = await repo.create({ name: '  PPL  ' });
    expect(routine).toMatchObject({ name: 'PPL', daysPerWeek: 3, days: [] });
    expect(routine.description).toBeUndefined();
    expect(await repo.get(routine.id)).toEqual(routine);
  });

  it('rechaza nombre vacío y días por semana fuera de 1-7', async () => {
    expect((await failure(repo.create({ name: '   ' }))).code).toBe('invalid');
    expect((await failure(repo.create({ name: 'A', daysPerWeek: 0 }))).code).toBe('invalid');
    expect((await failure(repo.create({ name: 'A', daysPerWeek: 8 }))).code).toBe('invalid');
    expect((await failure(repo.create({ name: 'A', daysPerWeek: 2.5 }))).code).toBe('invalid');
  });

  it('la primera rutina queda activa y las siguientes no', async () => {
    const first = await repo.create({ name: 'A' });
    await repo.create({ name: 'B' });
    expect((await repo.getActive())?.id).toBe(first.id);
  });
});

describe('list', () => {
  it('ordena por creación', async () => {
    const a = await repo.create({ name: 'A' });
    await new Promise((r) => setTimeout(r, 2));
    const b = await repo.create({ name: 'B' });
    expect((await repo.list()).map((r) => r.id)).toEqual([a.id, b.id]);
  });
});

describe('update', () => {
  it('renombra y reemplaza los días sin tocar id ni createdAt', async () => {
    const routine = await repo.create({ name: 'A', description: 'x' });
    const updated = await repo.update(routine.id, { name: ' Nueva ', days: [push] });
    expect(updated).toMatchObject({
      id: routine.id,
      createdAt: routine.createdAt,
      name: 'Nueva',
      description: 'x',
      days: [push],
    });
    expect(await repo.get(routine.id)).toEqual(updated);
  });

  it('una descripción vacía la quita', async () => {
    const routine = await repo.create({ name: 'A', description: 'x' });
    const updated = await repo.update(routine.id, { description: ' ' });
    expect(updated.description).toBeUndefined();
  });

  it('valida y falla si no existe', async () => {
    const routine = await repo.create({ name: 'A' });
    expect((await failure(repo.update(routine.id, { name: '' }))).code).toBe('invalid');
    expect((await failure(repo.update('nope', { name: 'B' }))).code).toBe('not-found');
  });
});

describe('duplicate', () => {
  it('copia con ids nuevos, sufijo "(copia)" y sin activarla', async () => {
    const original = await repo.create({ name: 'PPL', days: [push] });
    const copy = await repo.duplicate(original.id);
    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('PPL (copia)');
    expect(copy.days[0].id).not.toBe('push');
    expect(copy.days[0].items).toEqual(push.items);
    expect(copy.days[0].items[0]).not.toBe(push.items[0]);
    expect((await repo.getActive())?.id).toBe(original.id);
    expect(await repo.list()).toHaveLength(2);
  });

  it('falla si no existe', async () => {
    expect((await failure(repo.duplicate('nope'))).code).toBe('not-found');
  });
});

describe('setActive', () => {
  it('cambia la rutina activa', async () => {
    await repo.create({ name: 'A' });
    const b = await repo.create({ name: 'B' });
    await repo.setActive(b.id);
    expect((await repo.getActive())?.id).toBe(b.id);
  });

  it('falla si no existe y no cambia la activa', async () => {
    const a = await repo.create({ name: 'A' });
    expect((await failure(repo.setActive('nope'))).code).toBe('not-found');
    expect((await repo.getActive())?.id).toBe(a.id);
  });

  it('sin rutinas no hay activa', async () => {
    expect(await repo.getActive()).toBeUndefined();
  });
});

describe('remove', () => {
  it('borra una rutina no activa sin tocar la activa', async () => {
    const a = await repo.create({ name: 'A' });
    const b = await repo.create({ name: 'B' });
    await repo.remove(b.id);
    expect(await repo.get(b.id)).toBeUndefined();
    expect((await repo.getActive())?.id).toBe(a.id);
  });

  it('si borras la activa, pasa a serlo la más antigua que queda', async () => {
    const a = await repo.create({ name: 'A' });
    await new Promise((r) => setTimeout(r, 2));
    const b = await repo.create({ name: 'B' });
    await new Promise((r) => setTimeout(r, 2));
    await repo.create({ name: 'C' });
    await repo.remove(a.id);
    expect((await repo.getActive())?.id).toBe(b.id);
  });

  it('si borras la última, no queda activa', async () => {
    const a = await repo.create({ name: 'A' });
    await repo.remove(a.id);
    expect(await repo.getActive()).toBeUndefined();
  });

  it('no toca las sesiones guardadas', async () => {
    const a = await repo.create({ name: 'A' });
    await db.sessions.add({ id: 's1', name: 'Push', routineId: a.id, startedAt: 1, sets: [] });
    await repo.remove(a.id);
    expect(await db.sessions.count()).toBe(1);
  });

  it('falla si no existe', async () => {
    expect((await failure(repo.remove('nope'))).code).toBe('not-found');
  });
});

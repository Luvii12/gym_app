import { GymDatabase } from './database';
import { createExerciseRepository, RepositoryError, type SeedExercise } from './exercises';

let db: GymDatabase;
let repo: ReturnType<typeof createExerciseRepository>;

beforeEach(() => {
  db = new GymDatabase(`test-${crypto.randomUUID()}`);
  repo = createExerciseRepository(db);
});

afterEach(async () => {
  await db.delete();
});

const bench: SeedExercise = {
  id: 'barbell-bench-press',
  name: 'Press banca plano con barra',
  muscleGroup: 'chest',
  muscles: 'Pecho mayor, tríceps, deltoides anterior',
  equipment: 'barbell',
};

async function failure(promise: Promise<unknown>): Promise<RepositoryError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(RepositoryError);
    return error as RepositoryError;
  }
  throw new Error('Se esperaba un error y no se produjo');
}

describe('esquema', () => {
  it('define las cuatro tablas', () => {
    expect(db.tables.map((t) => t.name).sort()).toEqual([
      'exercises',
      'routines',
      'sessions',
      'settings',
    ]);
  });

  it('los datos sobreviven a cerrar y volver a abrir la base', async () => {
    const created = await repo.create({
      name: 'Face pull',
      muscleGroup: 'shoulders',
      equipment: 'cable',
    });
    db.close();

    const reopened = new GymDatabase(db.name);
    const again = createExerciseRepository(reopened);
    expect(await again.get(created.id)).toEqual(created);
    reopened.close();
    db = reopened;
  });
});

describe('create', () => {
  it('crea un ejercicio propio con id único y lo guarda', async () => {
    const a = await repo.create({
      name: 'Face pull',
      muscleGroup: 'shoulders',
      equipment: 'cable',
    });
    const b = await repo.create({
      name: 'Curl martillo',
      muscleGroup: 'arms',
      equipment: 'dumbbell',
    });

    expect(a.isCustom).toBe(true);
    expect(a.id).not.toBe(b.id);
    expect(await repo.get(a.id)).toEqual(a);
  });

  it('recorta los espacios del nombre', async () => {
    const created = await repo.create({
      name: '  Face pull  ',
      muscleGroup: 'shoulders',
      equipment: 'cable',
    });
    expect(created.name).toBe('Face pull');
  });

  it('rechaza un nombre vacío', async () => {
    const error = await failure(
      repo.create({ name: '   ', muscleGroup: 'core', equipment: 'other' }),
    );
    expect(error.code).toBe('invalid');
    expect(await repo.count()).toBe(0);
  });
});

describe('list y get', () => {
  it('ordena por nombre respetando las tildes del español', async () => {
    for (const name of ['Remo con barra', 'Curl bíceps', 'Ábdominales', 'Elevaciones laterales']) {
      await repo.create({ name, muscleGroup: 'core', equipment: 'other' });
    }
    expect((await repo.list()).map((e) => e.name)).toEqual([
      'Ábdominales',
      'Curl bíceps',
      'Elevaciones laterales',
      'Remo con barra',
    ]);
  });

  it('get devuelve undefined si no existe', async () => {
    expect(await repo.get('no-existe')).toBeUndefined();
  });
});

describe('update', () => {
  it('modifica un ejercicio propio y conserva id e isCustom', async () => {
    const created = await repo.create({
      name: 'Face pull',
      muscleGroup: 'shoulders',
      equipment: 'cable',
    });
    const updated = await repo.update(created.id, {
      name: 'Face pull con cuerda',
      muscles: 'Deltoides posterior',
    });

    expect(updated).toEqual({
      ...created,
      name: 'Face pull con cuerda',
      muscles: 'Deltoides posterior',
    });
    expect(await repo.get(created.id)).toEqual(updated);
  });

  it('no permite modificar los de la semilla', async () => {
    await repo.seed([bench]);
    const error = await failure(repo.update(bench.id, { name: 'Otro nombre' }));
    expect(error.code).toBe('forbidden');
    expect((await repo.get(bench.id))?.name).toBe(bench.name);
  });

  it('falla si el ejercicio no existe', async () => {
    expect((await failure(repo.update('nada', { name: 'x' }))).code).toBe('not-found');
  });

  it('rechaza dejar el nombre vacío', async () => {
    const created = await repo.create({
      name: 'Face pull',
      muscleGroup: 'shoulders',
      equipment: 'cable',
    });
    expect((await failure(repo.update(created.id, { name: ' ' }))).code).toBe('invalid');
    expect((await repo.get(created.id))?.name).toBe('Face pull');
  });
});

describe('remove', () => {
  it('borra un ejercicio propio', async () => {
    const created = await repo.create({
      name: 'Face pull',
      muscleGroup: 'shoulders',
      equipment: 'cable',
    });
    await repo.remove(created.id);
    expect(await repo.get(created.id)).toBeUndefined();
  });

  it('no permite borrar los de la semilla', async () => {
    await repo.seed([bench]);
    expect((await failure(repo.remove(bench.id))).code).toBe('forbidden');
    expect(await repo.get(bench.id)).toBeDefined();
  });

  it('falla si no existe', async () => {
    expect((await failure(repo.remove('nada'))).code).toBe('not-found');
  });
});

describe('seed', () => {
  it('inserta los ejercicios como no propios', async () => {
    const result = await repo.seed([bench]);
    expect(result).toEqual({ added: 1, updated: 0 });
    expect(await repo.get(bench.id)).toEqual({ ...bench, isCustom: false });
  });

  it('es idempotente: repetir la carga no cambia nada', async () => {
    await repo.seed([bench]);
    const second = await repo.seed([bench]);
    expect(second).toEqual({ added: 0, updated: 0 });
    expect(await repo.count()).toBe(1);
  });

  it('actualiza los de la semilla si cambia su contenido', async () => {
    await repo.seed([bench]);
    const result = await repo.seed([{ ...bench, name: 'Press de banca con barra' }]);
    expect(result).toEqual({ added: 0, updated: 1 });
    expect((await repo.get(bench.id))?.name).toBe('Press de banca con barra');
  });

  it('no toca los ejercicios propios, ni siquiera con el mismo id', async () => {
    const mine = await repo.create({
      name: 'Mi press',
      muscleGroup: 'chest',
      equipment: 'barbell',
    });
    const result = await repo.seed([
      { ...bench, id: mine.id },
      { ...bench, id: 'otro' },
    ]);

    expect(result).toEqual({ added: 1, updated: 0 });
    expect(await repo.get(mine.id)).toEqual(mine);
  });
});

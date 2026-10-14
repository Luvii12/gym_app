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

describe('nombres repetidos', () => {
  it('no permite crear un ejercicio con el nombre de otro, ni con otras tildes o mayúsculas', async () => {
    await repo.seed([bench]);
    const sameAsSeed = await failure(
      repo.create({
        name: 'PRESS banca plano con barra',
        muscleGroup: 'chest',
        equipment: 'barbell',
      }),
    );
    expect(sameAsSeed.code).toBe('duplicate');

    await repo.create({ name: 'Curl Scott', muscleGroup: 'arms', equipment: 'barbell' });
    const sameAsMine = await failure(
      repo.create({ name: 'curl scott ', muscleGroup: 'arms', equipment: 'barbell' }),
    );
    expect(sameAsMine.code).toBe('duplicate');
  });

  it('al editar, puede conservar su propio nombre pero no usar el de otro', async () => {
    const a = await repo.create({
      name: 'Face pull',
      muscleGroup: 'shoulders',
      equipment: 'cable',
    });
    await repo.create({ name: 'Curl Scott', muscleGroup: 'arms', equipment: 'barbell' });

    expect((await repo.update(a.id, { name: 'Face pull', muscleGroup: 'back' })).muscleGroup).toBe(
      'back',
    );
    expect((await failure(repo.update(a.id, { name: 'Curl scott' }))).code).toBe('duplicate');
  });

  it('rechaza un nombre demasiado largo', async () => {
    const error = await failure(
      repo.create({ name: 'a'.repeat(61), muscleGroup: 'core', equipment: 'other' }),
    );
    expect(error.code).toBe('invalid');
  });
});

describe('músculos opcionales', () => {
  it('guarda el texto recortado y omite el campo si queda vacío', async () => {
    const withText = await repo.create({
      name: 'Con músculos',
      muscleGroup: 'back',
      equipment: 'cable',
      muscles: '  Dorsal ancho ',
    });
    expect(withText.muscles).toBe('Dorsal ancho');

    const blank = await repo.create({
      name: 'Sin músculos',
      muscleGroup: 'back',
      equipment: 'cable',
      muscles: '   ',
    });
    expect(blank).not.toHaveProperty('muscles');
  });

  it('se puede vaciar al editar', async () => {
    const created = await repo.create({
      name: 'Con músculos',
      muscleGroup: 'back',
      equipment: 'cable',
      muscles: 'Dorsal ancho',
    });
    expect(await repo.update(created.id, { muscles: '' })).not.toHaveProperty('muscles');
  });
});

describe('borrar o archivar', () => {
  const mine = () =>
    repo.create({ name: 'Face pull', muscleGroup: 'shoulders', equipment: 'cable' });

  it('borra de verdad un ejercicio que no se usa en ningún sitio', async () => {
    const created = await mine();
    expect(await repo.remove(created.id)).toBe('deleted');
    expect(await repo.get(created.id)).toBeUndefined();
  });

  it('archiva un ejercicio que está en una rutina', async () => {
    const created = await mine();
    await db.routines.add({
      id: 'r1',
      name: 'Push',
      daysPerWeek: 3,
      createdAt: 1,
      days: [
        {
          id: 'd1',
          name: 'A',
          kind: 'training',
          items: [{ exerciseId: created.id, sets: 3, repsMin: 8, repsMax: 10, restSec: 90 }],
        },
      ],
    });

    expect(await repo.remove(created.id)).toBe('archived');
    expect((await repo.get(created.id))?.archivedAt).toBeGreaterThan(0);
  });

  it('archiva un ejercicio que está en el historial', async () => {
    const created = await mine();
    await db.sessions.add({
      id: 's1',
      name: 'Push A',
      startedAt: 1,
      endedAt: 2,
      sets: [{ exerciseId: created.id, setIndex: 0, weightKg: 20, reps: 10, completedAt: 2 }],
    });
    expect(await repo.remove(created.id)).toBe('archived');
  });

  it('un archivado desaparece del catálogo y del recuento, pero su nombre sigue disponible', async () => {
    const created = await mine();
    await db.sessions.add({
      id: 's1',
      name: 'Push A',
      startedAt: 1,
      endedAt: 2,
      sets: [{ exerciseId: created.id, setIndex: 0, weightKg: 20, reps: 10, completedAt: 2 }],
    });
    await repo.remove(created.id);

    expect(await repo.list()).toEqual([]);
    expect(await repo.count()).toBe(0);
    expect((await repo.list({ includeArchived: true })).map((e) => e.id)).toEqual([created.id]);
    expect((await repo.get(created.id))?.name).toBe('Face pull');
  });

  it('el nombre de un archivado se puede volver a usar', async () => {
    const created = await mine();
    await db.sessions.add({
      id: 's1',
      name: 'Push A',
      startedAt: 1,
      endedAt: 2,
      sets: [{ exerciseId: created.id, setIndex: 0, weightKg: 20, reps: 10, completedAt: 2 }],
    });
    await repo.remove(created.id);

    const again = await mine();
    expect(again.id).not.toBe(created.id);
  });

  it('no se puede editar ni volver a borrar un archivado', async () => {
    const created = await mine();
    await db.sessions.add({
      id: 's1',
      name: 'Push A',
      startedAt: 1,
      endedAt: 2,
      sets: [{ exerciseId: created.id, setIndex: 0, weightKg: 20, reps: 10, completedAt: 2 }],
    });
    await repo.remove(created.id);

    expect((await failure(repo.update(created.id, { name: 'Otro' }))).code).toBe('not-found');
    expect((await failure(repo.remove(created.id))).code).toBe('not-found');
  });
});

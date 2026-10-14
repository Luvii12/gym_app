import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db, exerciseRepository, RepositoryError, seedCatalog } from '../../db';
import type { Exercise } from '../../domain';
import { ExerciseSheet, type ExerciseSheetMode } from './ExerciseSheet';

beforeEach(async () => {
  await Promise.all([db.exercises.clear(), db.sessions.clear(), db.routines.clear()]);
  await seedCatalog();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function renderSheet(mode: ExerciseSheetMode = 'create') {
  const onDone = vi.fn();
  const onClose = vi.fn();
  const exercises = await exerciseRepository.list();
  render(<ExerciseSheet mode={mode} exercises={exercises} onClose={onClose} onDone={onDone} />);
  return { onDone, onClose, user: userEvent.setup() };
}

function nameInput() {
  return screen.getByRole('textbox', { name: 'Nombre' });
}

function musclesInput() {
  return screen.getByRole('textbox', { name: 'Músculos trabajados' });
}

async function createMine(
  overrides: Partial<Parameters<typeof exerciseRepository.create>[0]> = {},
): Promise<Exercise> {
  return exerciseRepository.create({
    name: 'Face pull con cuerda',
    muscleGroup: 'shoulders',
    equipment: 'cable',
    muscles: 'Deltoides posterior',
    ...overrides,
  });
}

async function mineInDb(): Promise<Exercise[]> {
  return (await db.exercises.toArray()).filter((e) => e.isCustom);
}

describe('ExerciseSheet: crear', () => {
  it('muestra el formulario de creación con sus campos y botones', async () => {
    await renderSheet();

    expect(screen.getByRole('dialog', { name: 'Nuevo ejercicio' })).toBeInTheDocument();
    expect(nameInput()).toHaveValue('');
    expect(nameInput()).toHaveFocus();
    expect(screen.getByRole('combobox', { name: 'Grupo muscular' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Equipamiento' })).toBeInTheDocument();
    expect(musclesInput()).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Crear ejercicio' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Borrar ejercicio' })).not.toBeInTheDocument();
  });

  it('crea un ejercicio propio en la base y avisa con "Ejercicio creado"', async () => {
    const { user, onDone, onClose } = await renderSheet();

    await user.type(nameInput(), 'Face pull con cuerda');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Grupo muscular' }), 'Hombros');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Equipamiento' }), 'Polea');
    await user.type(musclesInput(), 'Deltoides posterior');
    await user.click(screen.getByRole('button', { name: 'Crear ejercicio' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledWith('Ejercicio creado'));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    const mine = await mineInDb();
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({
      name: 'Face pull con cuerda',
      muscleGroup: 'shoulders',
      equipment: 'cable',
      muscles: 'Deltoides posterior',
      isCustom: true,
    });
    expect(mine[0]?.archivedAt).toBeUndefined();
  });

  it('con Enter en el nombre también envía el formulario', async () => {
    const { user, onDone } = await renderSheet();

    await user.type(nameInput(), 'Remo con banda{Enter}');

    await waitFor(() => expect(onDone).toHaveBeenCalledWith('Ejercicio creado'));
    expect((await mineInDb()).map((e) => e.name)).toEqual(['Remo con banda']);
  });

  it('recorta los espacios del nombre y no guarda "muscles" si se deja vacío', async () => {
    const { user, onDone } = await renderSheet();

    await user.type(nameInput(), '   Remo con banda   ');
    await user.click(screen.getByRole('button', { name: 'Crear ejercicio' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const [created] = await mineInDb();
    expect(created?.name).toBe('Remo con banda');
    expect(created).not.toHaveProperty('muscles');
  });

  it('no guarda con el nombre vacío y muestra el mensaje en el campo', async () => {
    const { user, onDone } = await renderSheet();
    expect(screen.queryByText('Escribe un nombre.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear ejercicio' }));

    expect(await screen.findByText('Escribe un nombre.')).toBeVisible();
    expect(nameInput()).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput()).toHaveAccessibleDescription('Escribe un nombre.');
    expect(onDone).not.toHaveBeenCalled();
    expect(await mineInDb()).toHaveLength(0);
  });

  it('un nombre de solo espacios cuenta como vacío', async () => {
    const { user, onDone } = await renderSheet();

    await user.type(nameInput(), '    ');
    await user.click(screen.getByRole('button', { name: 'Crear ejercicio' }));

    expect(await screen.findByText('Escribe un nombre.')).toBeVisible();
    expect(onDone).not.toHaveBeenCalled();
    expect(await mineInDb()).toHaveLength(0);
  });

  it('no enseña errores antes del primer intento, ni siquiera con un nombre repetido', async () => {
    const { user } = await renderSheet();

    await user.type(nameInput(), 'Jalón al pecho');

    expect(screen.queryByText('Ya existe un ejercicio con ese nombre.')).not.toBeInTheDocument();
    expect(nameInput()).not.toHaveAttribute('aria-invalid');
  });

  it('rechaza un nombre igual a uno de la semilla aunque cambien tildes y mayúsculas', async () => {
    const { user, onDone } = await renderSheet();

    await user.type(nameInput(), 'JALON AL PECHO');
    await user.click(screen.getByRole('button', { name: 'Crear ejercicio' }));

    expect(await screen.findByText('Ya existe un ejercicio con ese nombre.')).toBeVisible();
    expect(nameInput()).toHaveAttribute('aria-invalid', 'true');
    expect(onDone).not.toHaveBeenCalled();
    expect(await mineInDb()).toHaveLength(0);
  });

  it('rechaza un nombre igual a uno propio aunque cambien tildes y mayúsculas', async () => {
    await createMine({ name: 'Elevación con Péndulo' });
    const { user, onDone } = await renderSheet();

    await user.type(nameInput(), 'elevacion con pendulo');
    await user.click(screen.getByRole('button', { name: 'Crear ejercicio' }));

    expect(await screen.findByText('Ya existe un ejercicio con ese nombre.')).toBeVisible();
    expect(onDone).not.toHaveBeenCalled();
    expect(await mineInDb()).toHaveLength(1);
  });

  it('el error se limpia en cuanto el nombre vuelve a ser válido', async () => {
    const { user } = await renderSheet();
    await user.click(screen.getByRole('button', { name: 'Crear ejercicio' }));
    await screen.findByText('Escribe un nombre.');

    await user.type(nameInput(), 'R');

    await waitFor(() => expect(screen.queryByText('Escribe un nombre.')).not.toBeInTheDocument());
    expect(nameInput()).not.toHaveAttribute('aria-invalid');
  });

  it('el aviso de duplicado se va al cambiar el nombre', async () => {
    const { user } = await renderSheet();
    await user.type(nameInput(), 'Jalón al pecho');
    await user.click(screen.getByRole('button', { name: 'Crear ejercicio' }));
    await screen.findByText('Ya existe un ejercicio con ese nombre.');

    await user.type(nameInput(), ' agarre estrecho');

    await waitFor(() =>
      expect(screen.queryByText('Ya existe un ejercicio con ese nombre.')).not.toBeInTheDocument(),
    );
  });

  it('un nombre repetido sí se acepta si el original está archivado (no es visible)', async () => {
    const original = await createMine();
    await db.sessions.add({
      id: 's1',
      name: 'Hombros',
      startedAt: 1,
      endedAt: 2,
      sets: [{ exerciseId: original.id, setIndex: 0, weightKg: 10, reps: 12, completedAt: 2 }],
    });
    expect(await exerciseRepository.remove(original.id)).toBe('archived');
    const { user, onDone } = await renderSheet();

    await user.type(nameInput(), 'Face pull con cuerda');
    await user.click(screen.getByRole('button', { name: 'Crear ejercicio' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledWith('Ejercicio creado'));
  });

  it('si el repositorio falla enseña un aviso, reactiva los botones y permite reintentar', async () => {
    vi.spyOn(exerciseRepository, 'create').mockRejectedValueOnce(new Error('disco lleno'));
    const { user, onDone } = await renderSheet();
    await user.type(nameInput(), 'Face pull con cuerda');

    await user.click(screen.getByRole('button', { name: 'Crear ejercicio' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo guardar. Inténtalo de nuevo.',
    );
    expect(screen.getByRole('button', { name: 'Crear ejercicio' })).toBeEnabled();
    expect(nameInput()).toHaveValue('Face pull con cuerda');
    expect(onDone).not.toHaveBeenCalled();
    expect(await mineInDb()).toHaveLength(0);

    // La segunda llamada ya no está simulada: el reintento funciona y limpia el aviso.
    await user.click(screen.getByRole('button', { name: 'Crear ejercicio' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('Ejercicio creado'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(await mineInDb()).toHaveLength(1);
  });

  it('un "duplicate" del repositorio (carrera) se muestra en el campo nombre, no como aviso general', async () => {
    vi.spyOn(exerciseRepository, 'create').mockRejectedValueOnce(
      new RepositoryError('duplicate', 'Ya existe un ejercicio con ese nombre'),
    );
    const { user, onDone } = await renderSheet();
    await user.type(nameInput(), 'Nombre libre en pantalla');

    await user.click(screen.getByRole('button', { name: 'Crear ejercicio' }));

    expect(await screen.findByText('Ya existe un ejercicio con ese nombre.')).toBeVisible();
    expect(nameInput()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear ejercicio' })).toBeEnabled();
    expect(onDone).not.toHaveBeenCalled();

    // Al editar el nombre el error de carrera se retira.
    await user.type(nameInput(), ' 2');
    await waitFor(() =>
      expect(screen.queryByText('Ya existe un ejercicio con ese nombre.')).not.toBeInTheDocument(),
    );
  });
});

describe('ExerciseSheet: editar', () => {
  it('precarga los datos del ejercicio y ofrece Guardar cambios y Borrar ejercicio', async () => {
    const mine = await createMine();
    await renderSheet({ edit: mine });

    expect(screen.getByRole('dialog', { name: 'Editar ejercicio' })).toBeInTheDocument();
    expect(nameInput()).toHaveValue('Face pull con cuerda');
    expect(screen.getByRole('combobox', { name: 'Grupo muscular' })).toHaveDisplayValue('Hombros');
    expect(screen.getByRole('combobox', { name: 'Equipamiento' })).toHaveDisplayValue('Polea');
    expect(musclesInput()).toHaveValue('Deltoides posterior');
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Borrar ejercicio' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Crear ejercicio' })).not.toBeInTheDocument();
  });

  it('guarda los cambios en la base y avisa con "Cambios guardados"', async () => {
    const mine = await createMine();
    const { user, onDone } = await renderSheet({ edit: mine });

    await user.clear(nameInput());
    await user.type(nameInput(), 'Face pull en polea alta');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Grupo muscular' }), 'Espalda');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Equipamiento' }), 'Banda');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledWith('Cambios guardados'));
    const saved = await db.exercises.get(mine.id);
    expect(saved).toMatchObject({
      id: mine.id,
      name: 'Face pull en polea alta',
      muscleGroup: 'back',
      equipment: 'band',
      muscles: 'Deltoides posterior',
      isCustom: true,
    });
    expect(await mineInDb()).toHaveLength(1);
  });

  it('puede guardar sin cambiar el nombre (no choca consigo mismo)', async () => {
    const mine = await createMine();
    const { user, onDone } = await renderSheet({ edit: mine });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Equipamiento' }), 'Mancuernas');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledWith('Cambios guardados'));
    expect(screen.queryByText('Ya existe un ejercicio con ese nombre.')).not.toBeInTheDocument();
    expect((await db.exercises.get(mine.id))?.equipment).toBe('dumbbell');
  });

  it('puede cambiar solo mayúsculas y tildes de su propio nombre', async () => {
    const mine = await createMine({ name: 'Elevacion lateral' });
    const { user, onDone } = await renderSheet({ edit: mine });

    await user.clear(nameInput());
    await user.type(nameInput(), 'Elevación Lateral');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledWith('Cambios guardados'));
    expect((await db.exercises.get(mine.id))?.name).toBe('Elevación Lateral');
  });

  it('no deja renombrarlo al nombre de otro ejercicio', async () => {
    const mine = await createMine();
    const { user, onDone } = await renderSheet({ edit: mine });

    await user.clear(nameInput());
    await user.type(nameInput(), 'jalon al pecho');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Ya existe un ejercicio con ese nombre.')).toBeVisible();
    expect(onDone).not.toHaveBeenCalled();
    expect((await db.exercises.get(mine.id))?.name).toBe('Face pull con cuerda');
  });

  it('no deja vaciar el nombre al editar', async () => {
    const mine = await createMine();
    const { user, onDone } = await renderSheet({ edit: mine });

    await user.clear(nameInput());
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Escribe un nombre.')).toBeVisible();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('vaciar "Músculos trabajados" lo quita del ejercicio', async () => {
    const mine = await createMine();
    const { user, onDone } = await renderSheet({ edit: mine });

    await user.clear(musclesInput());
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledWith('Cambios guardados'));
    const saved = await db.exercises.get(mine.id);
    expect(saved?.name).toBe('Face pull con cuerda');
    expect(saved?.muscles).toBeUndefined();
  });

  it('si el repositorio falla al guardar enseña el aviso y deja reintentar', async () => {
    const mine = await createMine();
    vi.spyOn(exerciseRepository, 'update').mockRejectedValueOnce(new Error('boom'));
    const { user, onDone } = await renderSheet({ edit: mine });

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo guardar. Inténtalo de nuevo.',
    );
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Borrar ejercicio' })).toBeEnabled();
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe('ExerciseSheet: borrar', () => {
  async function openConfirmation(mine: Exercise) {
    const ctx = await renderSheet({ edit: mine });
    await ctx.user.click(screen.getByRole('button', { name: 'Borrar ejercicio' }));
    const dialog = await screen.findByRole('dialog', { name: `¿Borrar «${mine.name}»?` });
    return { ...ctx, dialog };
  }

  it('"Borrar ejercicio" pide confirmación con Borrar y Cancelar, sin borrar todavía', async () => {
    const mine = await createMine();
    const { dialog, onDone } = await openConfirmation(mine);

    expect(within(dialog).getByRole('button', { name: 'Borrar' })).toBeEnabled();
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    expect(screen.queryByRole('textbox', { name: 'Nombre' })).not.toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    expect(await db.exercises.get(mine.id)).toBeDefined();
  });

  it('"Cancelar" vuelve al formulario con lo escrito, sin borrar', async () => {
    const mine = await createMine();
    const { user, onDone } = await renderSheet({ edit: mine });
    await user.type(nameInput(), ' v2');
    await user.click(screen.getByRole('button', { name: 'Borrar ejercicio' }));
    await screen.findByRole('dialog', { name: '¿Borrar «Face pull con cuerda»?' });

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByRole('dialog', { name: 'Editar ejercicio' })).toBeInTheDocument();
    expect(nameInput()).toHaveValue('Face pull con cuerda v2');
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled();
    expect(onDone).not.toHaveBeenCalled();
    expect(await db.exercises.get(mine.id)).toBeDefined();
  });

  it('borra de verdad un ejercicio sin uso y avisa con "Ejercicio borrado"', async () => {
    const mine = await createMine();
    const { user, onDone } = await openConfirmation(mine);

    await user.click(screen.getByRole('button', { name: 'Borrar' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledWith('Ejercicio borrado'));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(await db.exercises.get(mine.id)).toBeUndefined();
  });

  it('un ejercicio usado en una sesión se archiva: aviso de historial y archivedAt en la base', async () => {
    const mine = await createMine();
    await db.sessions.add({
      id: 's1',
      name: 'Hombros',
      startedAt: 1,
      endedAt: 2,
      sets: [{ exerciseId: mine.id, setIndex: 0, weightKg: 20, reps: 10, completedAt: 2 }],
    });
    const { user, onDone } = await openConfirmation(mine);

    await user.click(screen.getByRole('button', { name: 'Borrar' }));

    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith(
        'Ejercicio quitado del catálogo. Se conserva en tu historial.',
      ),
    );
    const stored = await db.exercises.get(mine.id);
    expect(stored?.archivedAt).toBeGreaterThan(0);
    expect(stored?.name).toBe('Face pull con cuerda');
  });

  it('un ejercicio usado en una rutina se archiva igualmente', async () => {
    const mine = await createMine();
    await db.routines.add({
      id: 'r1',
      name: 'Push Pull',
      daysPerWeek: 3,
      createdAt: 1,
      days: [
        {
          id: 'd1',
          name: 'Hombros',
          kind: 'training',
          items: [{ exerciseId: mine.id, sets: 3, repsMin: 12, repsMax: 15, restSec: 60 }],
        },
      ],
    });
    const { user, onDone } = await openConfirmation(mine);

    await user.click(screen.getByRole('button', { name: 'Borrar' }));

    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith(
        'Ejercicio quitado del catálogo. Se conserva en tu historial.',
      ),
    );
    expect((await db.exercises.get(mine.id))?.archivedAt).toBeGreaterThan(0);
  });

  it('si el repositorio rechaza, enseña el aviso, reactiva Borrar y Cancelar y no cierra', async () => {
    const mine = await createMine();
    vi.spyOn(exerciseRepository, 'remove').mockRejectedValueOnce(new Error('boom'));
    const { user, dialog, onDone } = await openConfirmation(mine);

    await user.click(screen.getByRole('button', { name: 'Borrar' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'No se pudo borrar. Inténtalo de nuevo.',
    );
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled();
    expect(onDone).not.toHaveBeenCalled();
    expect(await db.exercises.get(mine.id)).toBeDefined();

    // Reintento: ya no está simulado.
    await user.click(screen.getByRole('button', { name: 'Borrar' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('Ejercicio borrado'));
    expect(await db.exercises.get(mine.id)).toBeUndefined();
  });

  it('el aviso de fallo desaparece al cancelar y volver al formulario', async () => {
    const mine = await createMine();
    vi.spyOn(exerciseRepository, 'remove').mockRejectedValueOnce(new Error('boom'));
    const { user } = await openConfirmation(mine);
    await user.click(screen.getByRole('button', { name: 'Borrar' }));
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    await screen.findByRole('dialog', { name: 'Editar ejercicio' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Escape en la confirmación cierra la hoja entera (onClose) sin borrar', async () => {
    const mine = await createMine();
    const { user, onClose, onDone } = await openConfirmation(mine);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
    expect(await db.exercises.get(mine.id)).toBeDefined();
  });
});

describe('ExerciseSheet: cierre', () => {
  it('"Cerrar" y Escape llaman a onClose sin guardar nada', async () => {
    const { user, onClose, onDone } = await renderSheet();
    await user.type(nameInput(), 'No guardar');

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onDone).not.toHaveBeenCalled();
    expect(await mineInDb()).toHaveLength(0);
  });
});

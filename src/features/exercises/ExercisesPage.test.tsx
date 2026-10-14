import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SEED_EXERCISES } from '../../data/exercises';
import { db, exerciseRepository, seedCatalog } from '../../db';
import { ExercisesPage } from './ExercisesPage';

/** Minúsculas y sin tildes, independiente de la implementación de dominio. */
function plain(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function countLabel(count: number): string {
  return count === 1 ? '1 ejercicio' : `${count} ejercicios`;
}

const TOTAL = SEED_EXERCISES.length;

beforeEach(async () => {
  await db.exercises.clear();
  await seedCatalog();
});

async function renderLoaded() {
  render(<ExercisesPage />);
  await screen.findByText(countLabel(TOTAL));
}

function searchbox() {
  return screen.getByRole('searchbox', { name: 'Buscar ejercicio o músculo' });
}

function groupFilter() {
  return screen.getByRole('group', { name: 'Filtrar por grupo muscular' });
}

function cardTitles() {
  return screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
}

describe('ExercisesPage', () => {
  it('muestra la cabecera, y primero una lista en carga que luego se llena', async () => {
    render(<ExercisesPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Catálogo de Ejercicios' })).toBeVisible();
    const skeleton = screen.getByRole('list', { name: 'Cargando ejercicios' });
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText(/\d+ ejercicios?$/)).not.toBeInTheDocument();

    await screen.findByText(countLabel(TOTAL));
    expect(screen.queryByRole('list', { name: 'Cargando ejercicios' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(TOTAL);
  });

  it('el recuento total coincide con el catálogo semilla', async () => {
    await renderLoaded();
    expect(screen.getByText(`${TOTAL} ejercicios`)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(TOTAL);
  });

  it('busca sin tildes ("jalon" encuentra "Jalón al pecho") y usa el singular en el recuento', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.type(searchbox(), 'jalon');

    await waitFor(() => expect(cardTitles()).toEqual(['Jalón al pecho']));
    expect(screen.getByText('1 ejercicio')).toBeInTheDocument();
  });

  it('busca por músculo ("triceps" encuentra ejercicios cuyos músculos incluyen tríceps)', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const expected = SEED_EXERCISES.filter((e) =>
      plain(`${e.name} ${e.muscles ?? ''}`).includes('triceps'),
    );
    expect(expected.length).toBeGreaterThan(1);

    await user.type(searchbox(), 'triceps');

    await screen.findByText(countLabel(expected.length));
    expect(cardTitles().sort()).toEqual(expected.map((e) => e.name).sort());
  });

  it('busca por equipamiento ("polea")', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const expected = SEED_EXERCISES.filter(
      (e) => e.equipment === 'cable' || plain(`${e.name} ${e.muscles ?? ''}`).includes('polea'),
    );
    expect(expected.length).toBeGreaterThan(1);

    await user.type(searchbox(), 'polea');

    await screen.findByText(countLabel(expected.length));
    expect(cardTitles()).toContain('Cruce de poleas');
    expect(cardTitles().sort()).toEqual(expected.map((e) => e.name).sort());
  });

  it('los chips tienen "Todos" marcado al inicio y un grupo marcado al elegirlo', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const chips = within(groupFilter());
    expect(chips.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');
    expect(chips.getByRole('button', { name: 'Pecho' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(chips.getByRole('button', { name: 'Pecho' }));

    const chest = SEED_EXERCISES.filter((e) => e.muscleGroup === 'chest');
    await screen.findByText(countLabel(chest.length));
    expect(chips.getByRole('button', { name: 'Pecho' })).toHaveAttribute('aria-pressed', 'true');
    expect(chips.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'false');
    expect(cardTitles().sort()).toEqual(chest.map((e) => e.name).sort());

    await user.click(chips.getByRole('button', { name: 'Todos' }));
    await screen.findByText(countLabel(TOTAL));
    expect(chips.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('solo ofrece chips de los grupos que tienen ejercicios (sin "Cardio" con la semilla)', async () => {
    await renderLoaded();
    const names = within(groupFilter())
      .getAllByRole('button')
      .map((b) => b.textContent);

    expect(names).toEqual(['Todos', 'Pecho', 'Espalda', 'Hombros', 'Brazos', 'Piernas', 'Core']);
    expect(screen.queryByRole('button', { name: 'Cardio' })).not.toBeInTheDocument();
  });

  it('aparece el chip de un grupo en cuanto hay un ejercicio suyo', async () => {
    await exerciseRepository.create({
      name: 'Remo en ergómetro',
      muscleGroup: 'cardio',
      equipment: 'machine',
    });
    render(<ExercisesPage />);
    await screen.findByText(countLabel(TOTAL + 1));

    expect(within(groupFilter()).getByRole('button', { name: 'Cardio' })).toBeInTheDocument();
  });

  it('combina grupo y búsqueda', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const chips = within(groupFilter());

    await user.click(chips.getByRole('button', { name: 'Espalda' }));
    await user.type(searchbox(), 'jalon');
    await waitFor(() => expect(cardTitles()).toEqual(['Jalón al pecho']));
    expect(screen.getByText('1 ejercicio')).toBeInTheDocument();

    // Mismo texto en otro grupo: no hay coincidencias.
    await user.click(chips.getByRole('button', { name: 'Pecho' }));
    expect(await screen.findByRole('heading', { name: 'Sin resultados' })).toBeInTheDocument();
    expect(screen.getByText('0 ejercicios')).toBeInTheDocument();
  });

  it('sin resultados ofrece "Limpiar filtros", que restaura búsqueda, grupo y lista', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const chips = within(groupFilter());

    await user.click(chips.getByRole('button', { name: 'Pecho' }));
    await user.type(searchbox(), 'jalon');
    await screen.findByRole('heading', { name: 'Sin resultados' });
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    await screen.findByText(countLabel(TOTAL));
    expect(searchbox()).toHaveValue('');
    expect(chips.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');
    expect(chips.getByRole('button', { name: 'Pecho' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('heading', { name: 'Sin resultados' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(TOTAL);
  });

  it('"Borrar búsqueda" vacía el campo y devuelve la lista completa', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    expect(screen.queryByRole('button', { name: 'Borrar búsqueda' })).not.toBeInTheDocument();

    await user.type(searchbox(), 'jalon');
    await screen.findByText('1 ejercicio');
    await user.click(screen.getByRole('button', { name: 'Borrar búsqueda' }));

    expect(searchbox()).toHaveValue('');
    await screen.findByText(countLabel(TOTAL));
    expect(screen.queryByRole('button', { name: 'Borrar búsqueda' })).not.toBeInTheDocument();
  });

  it('con el catálogo vacío muestra "Aún no hay ejercicios" y no el aviso de sin resultados', async () => {
    await db.exercises.clear();
    render(<ExercisesPage />);

    expect(await screen.findByRole('heading', { name: 'Aún no hay ejercicios' })).toBeVisible();
    expect(screen.getByText('0 ejercicios')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sin resultados' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Cargando ejercicios' })).not.toBeInTheDocument();
  });

  it('usa el singular con un único ejercicio en el catálogo', async () => {
    await db.exercises.clear();
    await exerciseRepository.create({
      name: 'Face pull',
      muscleGroup: 'shoulders',
      equipment: 'cable',
    });
    render(<ExercisesPage />);

    expect(await screen.findByText('1 ejercicio')).toBeInTheDocument();
  });

  it('cada tarjeta muestra grupo, origen, músculos y equipamiento', async () => {
    await exerciseRepository.create({
      name: 'Curl zottman',
      muscleGroup: 'arms',
      muscles: 'Bíceps, antebrazo',
      equipment: 'dumbbell',
    });
    const user = userEvent.setup();
    render(<ExercisesPage />);
    await screen.findByText(countLabel(TOTAL + 1));

    // Propio: "Personalizado".
    await user.type(searchbox(), 'zottman');
    const custom = (await screen.findByRole('heading', { name: 'Curl zottman' })).closest('li')!;
    expect(within(custom).getByText('Personalizado')).toBeInTheDocument();
    expect(within(custom).queryByText('Predeterminado')).not.toBeInTheDocument();
    expect(within(custom).getByText('Brazos')).toBeInTheDocument();
    expect(within(custom).getByText('Bíceps, antebrazo')).toBeInTheDocument();
    expect(within(custom).getByText('Mancuernas')).toBeInTheDocument();

    // Semilla: "Predeterminado".
    await user.clear(searchbox());
    await user.type(searchbox(), 'jalon');
    const seeded = (await screen.findByRole('heading', { name: 'Jalón al pecho' })).closest('li')!;
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Curl zottman' })).toBeNull());
    expect(within(seeded).getByText('Predeterminado')).toBeInTheDocument();
    expect(within(seeded).queryByText('Personalizado')).not.toBeInTheDocument();
    expect(within(seeded).getByText('Espalda')).toBeInTheDocument();
  });

  it('todos los ejercicios de la semilla se muestran como "Predeterminado"', async () => {
    await renderLoaded();
    expect(screen.getAllByText('Predeterminado')).toHaveLength(TOTAL);
    expect(screen.queryByText('Personalizado')).not.toBeInTheDocument();
  });

  it('se actualiza solo cuando se crea un ejercicio con la pantalla abierta', async () => {
    await renderLoaded();

    await exerciseRepository.create({
      name: 'Pullover con polea',
      muscleGroup: 'back',
      equipment: 'cable',
    });

    expect(await screen.findByText(countLabel(TOTAL + 1))).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pullover con polea' })).toBeInTheDocument();
  });
});

describe('ExercisesPage: crear, editar y borrar ejercicios propios', () => {
  beforeEach(async () => {
    await Promise.all([db.sessions.clear(), db.routines.clear()]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function fab() {
    return screen.getByRole('button', { name: 'Nuevo ejercicio' });
  }

  function toast() {
    return screen.getByRole('status');
  }

  async function createFromUi(
    user: ReturnType<typeof userEvent.setup>,
    name: string,
    muscles?: string,
  ) {
    await user.click(fab());
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo ejercicio' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Nombre' }), name);
    if (muscles) {
      await user.type(
        within(dialog).getByRole('textbox', { name: 'Músculos trabajados' }),
        muscles,
      );
    }
    await user.click(within(dialog).getByRole('button', { name: 'Crear ejercicio' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  }

  it('el botón flotante "Nuevo ejercicio" abre la hoja de creación y Escape devuelve el foco al botón', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(fab());

    const dialog = await screen.findByRole('dialog', { name: 'Nuevo ejercicio' });
    expect(within(dialog).getByRole('textbox', { name: 'Nombre' })).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(fab()).toHaveFocus();
    expect(within(toast()).queryByText(/./)).not.toBeInTheDocument();
  });

  it('crear un ejercicio lo añade a la lista como "Personalizado" y muestra el aviso "Ejercicio creado"', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await createFromUi(user, 'Face pull con cuerda', 'Deltoides posterior');

    await screen.findByText(countLabel(TOTAL + 1));
    const card = screen.getByRole('heading', { name: 'Face pull con cuerda' }).closest('li')!;
    expect(within(card).getByText('Personalizado')).toBeInTheDocument();
    expect(within(card).getByText('Deltoides posterior')).toBeInTheDocument();
    expect(toast()).toHaveTextContent('Ejercicio creado');
    expect(fab()).toHaveFocus();
    expect(await db.exercises.count()).toBe(TOTAL + 1);
  });

  it('el aviso desaparece solo a los 3 segundos', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await createFromUi(user, 'Face pull con cuerda');
    expect(toast()).toHaveTextContent('Ejercicio creado');

    // Tiempo real (los falsos temporizadores bloquean waitFor/Dexie): se espera, sin pausas
    // fijas, a que el aviso se retire, con margen sobre los 3 s.
    await waitFor(() => expect(toast()).toBeEmptyDOMElement(), { timeout: 4500 });
  }, 8000);

  it('crear un nombre ya existente en el catálogo (otras tildes y mayúsculas) enseña el error y no crea nada', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.click(fab());
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo ejercicio' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Nombre' }), 'JALON AL PECHO');
    await user.click(within(dialog).getByRole('button', { name: 'Crear ejercicio' }));

    expect(await within(dialog).findByText('Ya existe un ejercicio con ese nombre.')).toBeVisible();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(await db.exercises.count()).toBe(TOTAL);
    expect(toast()).toBeEmptyDOMElement();
  });

  it('solo los ejercicios propios tienen botón "Editar …"; los predeterminados no', async () => {
    await exerciseRepository.create({
      name: 'Face pull con cuerda',
      muscleGroup: 'shoulders',
      equipment: 'cable',
    });
    await exerciseRepository.create({
      name: 'Remo con banda',
      muscleGroup: 'back',
      equipment: 'band',
    });
    render(<ExercisesPage />);
    await screen.findByText(countLabel(TOTAL + 2));

    const editButtons = screen.getAllByRole('button', { name: /^Editar / });
    expect(editButtons.map((b) => b.getAttribute('aria-label')).sort()).toEqual([
      'Editar Face pull con cuerda',
      'Editar Remo con banda',
    ]);
    expect(screen.queryByRole('button', { name: 'Editar Jalón al pecho' })).not.toBeInTheDocument();
    const seeded = screen.getByRole('heading', { name: 'Jalón al pecho' }).closest('li')!;
    expect(within(seeded).queryByRole('button')).not.toBeInTheDocument();
  });

  it('el botón de editar mide al menos 44px (clase size-11) y no cambia el texto de la tarjeta', async () => {
    await exerciseRepository.create({
      name: 'Face pull con cuerda',
      muscleGroup: 'shoulders',
      equipment: 'cable',
    });
    render(<ExercisesPage />);
    await screen.findByText(countLabel(TOTAL + 1));

    expect(screen.getByRole('button', { name: 'Editar Face pull con cuerda' })).toHaveClass(
      'size-11',
    );
    expect(screen.getByRole('heading', { name: 'Face pull con cuerda' })).toBeVisible();
  });

  it('editar desde la lista abre la hoja con los datos, guarda y actualiza la tarjeta', async () => {
    const user = userEvent.setup();
    await exerciseRepository.create({
      name: 'Face pull con cuerda',
      muscleGroup: 'shoulders',
      equipment: 'cable',
      muscles: 'Deltoides posterior',
    });
    render(<ExercisesPage />);
    await screen.findByText(countLabel(TOTAL + 1));

    await user.click(screen.getByRole('button', { name: 'Editar Face pull con cuerda' }));
    const dialog = await screen.findByRole('dialog', { name: 'Editar ejercicio' });
    const name = within(dialog).getByRole('textbox', { name: 'Nombre' });
    expect(name).toHaveValue('Face pull con cuerda');
    await user.clear(name);
    await user.type(name, 'Face pull en polea alta');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));

    await screen.findByRole('heading', { name: 'Face pull en polea alta' });
    expect(screen.queryByRole('heading', { name: 'Face pull con cuerda' })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(toast()).toHaveTextContent('Cambios guardados');
    expect(screen.getByText(countLabel(TOTAL + 1))).toBeInTheDocument();
    // El foco vuelve al elemento que abrió la hoja (el botón se re-pinta con otro nombre).
    expect(document.body).not.toHaveFocus();
  });

  it('borrar desde la lista (con confirmación) lo quita de la lista y de la base', async () => {
    const user = userEvent.setup();
    await exerciseRepository.create({
      name: 'Face pull con cuerda',
      muscleGroup: 'shoulders',
      equipment: 'cable',
    });
    render(<ExercisesPage />);
    await screen.findByText(countLabel(TOTAL + 1));

    await user.click(screen.getByRole('button', { name: 'Editar Face pull con cuerda' }));
    await user.click(await screen.findByRole('button', { name: 'Borrar ejercicio' }));
    await user.click(await screen.findByRole('button', { name: 'Borrar' }));

    await screen.findByText(countLabel(TOTAL));
    expect(screen.queryByRole('heading', { name: 'Face pull con cuerda' })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(toast()).toHaveTextContent('Ejercicio borrado');
    expect(await db.exercises.count()).toBe(TOTAL);
  });

  it('cancelar la confirmación de borrado no quita nada', async () => {
    const user = userEvent.setup();
    await exerciseRepository.create({
      name: 'Face pull con cuerda',
      muscleGroup: 'shoulders',
      equipment: 'cable',
    });
    render(<ExercisesPage />);
    await screen.findByText(countLabel(TOTAL + 1));

    await user.click(screen.getByRole('button', { name: 'Editar Face pull con cuerda' }));
    await user.click(await screen.findByRole('button', { name: 'Borrar ejercicio' }));
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await user.click(await screen.findByRole('button', { name: 'Cerrar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Face pull con cuerda' })).toBeInTheDocument();
    expect(toast()).toBeEmptyDOMElement();
    expect(await db.exercises.count()).toBe(TOTAL + 1);
  });

  it('borrar un ejercicio usado en el historial lo oculta del catálogo, avisa y lo conserva archivado', async () => {
    const user = userEvent.setup();
    const mine = await exerciseRepository.create({
      name: 'Face pull con cuerda',
      muscleGroup: 'shoulders',
      equipment: 'cable',
    });
    await db.sessions.add({
      id: 's1',
      name: 'Hombros',
      startedAt: 1,
      endedAt: 2,
      sets: [{ exerciseId: mine.id, setIndex: 0, weightKg: 20, reps: 10, completedAt: 2 }],
    });
    render(<ExercisesPage />);
    await screen.findByText(countLabel(TOTAL + 1));

    await user.click(screen.getByRole('button', { name: 'Editar Face pull con cuerda' }));
    await user.click(await screen.findByRole('button', { name: 'Borrar ejercicio' }));
    await user.click(await screen.findByRole('button', { name: 'Borrar' }));

    await screen.findByText(countLabel(TOTAL));
    expect(screen.queryByRole('heading', { name: 'Face pull con cuerda' })).not.toBeInTheDocument();
    expect(toast()).toHaveTextContent(
      'Ejercicio quitado del catálogo. Se conserva en tu historial.',
    );
    expect((await db.exercises.get(mine.id))?.archivedAt).toBeGreaterThan(0);
  });

  it('el botón flotante sigue visible en "Sin resultados" y desde ahí se puede crear', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.type(searchbox(), 'zzzz');
    await screen.findByRole('heading', { name: 'Sin resultados' });

    expect(fab()).toBeVisible();

    await user.click(fab());
    expect(await screen.findByRole('dialog', { name: 'Nuevo ejercicio' })).toBeInTheDocument();
  });

  it('el botón flotante está también con el catálogo vacío', async () => {
    await db.exercises.clear();
    render(<ExercisesPage />);
    await screen.findByRole('heading', { name: 'Aún no hay ejercicios' });

    expect(fab()).toBeVisible();
  });

  it('un ejercicio recién creado se encuentra con el buscador', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await createFromUi(user, 'Face pull con cuerda');
    await screen.findByText(countLabel(TOTAL + 1));

    await user.type(searchbox(), 'face pull con cuerda');

    await waitFor(() => expect(cardTitles()).toEqual(['Face pull con cuerda']));
    expect(
      within(
        screen.getByRole('heading', { name: 'Face pull con cuerda' }).closest('li')!,
      ).getByText('Personalizado'),
    ).toBeInTheDocument();
  });
});

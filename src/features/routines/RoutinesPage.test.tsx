import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { db, routineRepository } from '../../db';
import { RoutinesPage } from './RoutinesPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/rutinas']}>
      <Routes>
        <Route path="/rutinas" element={<RoutinesPage />} />
        <Route path="/rutinas/:routineId" element={<p>Editor de prueba</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await db.routines.clear();
  await db.settings.clear();
});

async function seed(...names: string[]) {
  for (const name of names) {
    await routineRepository.create({ name });
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
}

function titles() {
  return screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
}

async function openMenu(name: string) {
  renderPage();
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: `Opciones de ${name}` }));
  return user;
}

describe('RoutinesPage', () => {
  it('"Editar" lleva al editor de la rutina, sea o no la activa', async () => {
    await seed('Push Pull Legs', 'Torso / Pierna');
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('link', { name: 'Editar Torso / Pierna' }));
    expect(await screen.findByText('Editor de prueba')).toBeVisible();
  });

  it('muestra el estado vacío sin rutinas', async () => {
    renderPage();
    expect(await screen.findByText('Aún no tienes rutinas')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Nueva rutina' })).toBeVisible();
  });

  it('lista las rutinas con la activa arriba y activar la cambia', async () => {
    await seed('Push Pull Legs', 'Torso / Pierna');
    await routineRepository.setActive((await routineRepository.list())[1]!.id);
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => expect(titles()).toEqual(['Torso / Pierna', 'Push Pull Legs']));
    expect(screen.getAllByText('Rutina activa')).toHaveLength(1);
    expect(screen.getAllByText('3 días / semana')).toHaveLength(2);
    expect(screen.getAllByText('0 días de entreno')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Activar esta rutina/ })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /Activar esta rutina/ }));

    await waitFor(() => expect(titles()).toEqual(['Push Pull Legs', 'Torso / Pierna']));
    expect(await screen.findByText('Rutina activada')).toBeVisible();
  });

  it('crea una rutina validando el nombre', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Aún no tienes rutinas');

    await user.click(screen.getByRole('button', { name: 'Nueva rutina' }));
    const dialog = screen.getByRole('dialog', { name: 'Nueva rutina' });
    await user.click(within(dialog).getByRole('button', { name: 'Crear rutina' }));
    expect(within(dialog).getByText('Escribe un nombre.')).toBeVisible();
    expect(await routineRepository.list()).toHaveLength(0);

    await user.type(within(dialog).getByLabelText('Nombre'), 'Full body');
    await user.click(within(dialog).getByRole('button', { name: 'Crear rutina' }));

    await waitFor(() => expect(titles()).toEqual(['Full body']));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Rutina activa')).toBeVisible();
  });

  it('renombra una rutina', async () => {
    await seed('Vieja');
    const user = await openMenu('Vieja');
    await user.click(screen.getByRole('button', { name: 'Renombrar' }));
    const input = screen.getByLabelText('Nombre');
    expect(input).toHaveValue('Vieja');
    await user.clear(input);
    await user.type(input, 'Nueva');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(titles()).toEqual(['Nueva']));
  });

  it('no permite renombrar con el nombre vacío', async () => {
    await seed('Vieja');
    const user = await openMenu('Vieja');
    await user.click(screen.getByRole('button', { name: 'Renombrar' }));
    await user.clear(screen.getByLabelText('Nombre'));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(screen.getByText('Escribe un nombre.')).toBeVisible();
    expect((await routineRepository.list())[0]!.name).toBe('Vieja');
  });

  it('duplica una rutina', async () => {
    await seed('Base');
    const user = await openMenu('Base');
    await user.click(screen.getByRole('button', { name: 'Duplicar' }));

    await waitFor(() => expect(titles()).toEqual(['Base', 'Base (copia)']));
    expect(await screen.findByText('Rutina duplicada')).toBeVisible();
  });

  it('borra con confirmación y avisa si es la activa', async () => {
    await seed('Uno', 'Dos');
    const user = await openMenu('Uno');
    await user.click(screen.getByRole('button', { name: 'Borrar' }));

    const dialog = screen.getByRole('dialog', { name: '¿Borrar «Uno»?' });
    expect(within(dialog).getByText(/Es tu rutina activa/)).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(await routineRepository.list()).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Opciones de Uno' }));
    await user.click(screen.getByRole('button', { name: 'Borrar' }));
    await user.click(
      within(screen.getByRole('dialog', { name: '¿Borrar «Uno»?' })).getByRole('button', {
        name: 'Borrar',
      }),
    );

    await waitFor(() => expect(titles()).toEqual(['Dos']));
    expect(screen.getByText('Rutina activa')).toBeVisible();
  });

  it('no avisa de rutina activa al borrar una que no lo es', async () => {
    await seed('Uno', 'Dos');
    const user = await openMenu('Dos');
    await user.click(screen.getByRole('button', { name: 'Borrar' }));
    expect(screen.queryByText(/Es tu rutina activa/)).not.toBeInTheDocument();
  });
});

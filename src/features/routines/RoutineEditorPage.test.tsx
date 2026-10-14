import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { db, routineRepository } from '../../db';
import { RoutineEditorPage } from './RoutineEditorPage';

beforeEach(async () => {
  await db.routines.clear();
  await db.settings.clear();
});

function renderEditor(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/rutinas/${id}`]}>
      <Routes>
        <Route path="/rutinas/:routineId" element={<RoutineEditorPage />} />
        <Route path="/rutinas" element={<p>Lista de rutinas</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function setup() {
  const routine = await routineRepository.create({ name: 'PPL' });
  const user = userEvent.setup();
  renderEditor(routine.id);
  await screen.findByRole('heading', { name: 'Editar rutina' });
  return { routine, user };
}

const stored = async (id: string) => (await routineRepository.get(id))!;
const dayNames = async (id: string) => (await stored(id)).days.map((d) => d.name);

describe('RoutineEditorPage', () => {
  it('muestra un mensaje y enlace a la lista si la rutina no existe', async () => {
    renderEditor('nada');
    expect(await screen.findByText('Rutina no encontrada')).toBeVisible();
    expect(screen.getByRole('link', { name: /Volver a mis rutinas/ })).toHaveAttribute(
      'href',
      '/rutinas',
    );
  });

  it('añade días de entreno y de descanso con nombres por defecto y persiste', async () => {
    const { routine, user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Añadir día de entreno' }));
    await user.click(screen.getByRole('button', { name: 'Añadir día de entreno' }));
    await user.click(screen.getByRole('button', { name: 'Añadir día de descanso activo' }));

    await waitFor(async () =>
      expect(await dayNames(routine.id)).toEqual(['Día 1', 'Día 2', 'Descanso']),
    );
    expect((await stored(routine.id)).days.map((d) => d.kind)).toEqual([
      'training',
      'training',
      'rest',
    ]);
    expect(screen.getByLabelText('Nombre del día 3')).toHaveValue('Descanso');
  });

  it('renombra un día al salir del campo', async () => {
    const { routine, user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Añadir día de entreno' }));
    const input = await screen.findByLabelText('Nombre del día 1');
    await user.clear(input);
    await user.type(input, 'Push A');
    await user.tab();
    await waitFor(async () => expect(await dayNames(routine.id)).toEqual(['Push A']));
  });

  it('un día de descanso guarda su nota y vuelve a entreno sin nota visible', async () => {
    const { routine, user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Añadir día de entreno' }));
    const group = await screen.findByRole('group', { name: 'Tipo del día 1' });
    await user.click(within(group).getByRole('button', { name: 'Descanso' }));

    const note = await screen.findByLabelText('Nota del día 1');
    await user.type(note, 'Cardio suave · 30 min');
    await user.tab();

    await waitFor(async () => {
      const day = (await stored(routine.id)).days[0]!;
      expect(day.kind).toBe('rest');
      expect(day.note).toBe('Cardio suave · 30 min');
    });

    await user.click(within(group).getByRole('button', { name: 'Entreno' }));
    await waitFor(() => expect(screen.queryByLabelText('Nota del día 1')).toBeNull());
  });

  it('reordena días con subir y bajar, con los extremos desactivados', async () => {
    const { routine, user } = await setup();
    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole('button', { name: 'Añadir día de entreno' }));
    }
    await screen.findByLabelText('Nombre del día 3');
    expect(screen.getByRole('button', { name: 'Subir día 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bajar día 3' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Bajar día 1' }));
    await waitFor(async () =>
      expect(await dayNames(routine.id)).toEqual(['Día 2', 'Día 1', 'Día 3']),
    );
    await user.click(screen.getByRole('button', { name: 'Subir día 3' }));
    await waitFor(async () =>
      expect(await dayNames(routine.id)).toEqual(['Día 2', 'Día 3', 'Día 1']),
    );
    expect(screen.getByLabelText('Nombre del día 1')).toHaveValue('Día 2');
  });

  it('borra un día solo tras confirmar en la app', async () => {
    const { routine, user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Añadir día de entreno' }));
    await user.click(screen.getByRole('button', { name: 'Añadir día de entreno' }));
    await screen.findByLabelText('Nombre del día 2');

    await user.click(screen.getByRole('button', { name: /Borrar día 1/ }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(await dayNames(routine.id)).toEqual(['Día 1', 'Día 2']);

    await user.click(screen.getByRole('button', { name: /Borrar día 1/ }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Borrar día' }),
    );
    await waitFor(async () => expect(await dayNames(routine.id)).toEqual(['Día 2']));
  });

  it('pide confirmación al pasar a descanso un día con ejercicios', async () => {
    const { routine, user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Añadir día de entreno' }));
    await screen.findByLabelText('Nombre del día 1');
    await routineRepository.update(routine.id, {
      days: [
        {
          ...(await stored(routine.id)).days[0]!,
          items: [{ exerciseId: 'x', sets: 3, repsMin: 8, repsMax: 10, restSec: 90 }],
        },
      ],
    });
    expect(await screen.findByText('1 ejercicio · 3 series')).toBeVisible();
    expect(screen.getByRole('link', { name: /Editar ejercicios de Día 1/ })).toHaveAttribute(
      'href',
      `/rutinas/${routine.id}/dias/${(await stored(routine.id)).days[0]!.id}`,
    );

    const group = screen.getByRole('group', { name: 'Tipo del día 1' });
    await user.click(within(group).getByRole('button', { name: 'Descanso' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
    expect((await stored(routine.id)).days[0]!.items).toHaveLength(1);

    await user.click(within(group).getByRole('button', { name: 'Descanso' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Pasar a descanso' }),
    );
    await waitFor(async () => {
      const day = (await stored(routine.id)).days[0]!;
      expect(day.kind).toBe('rest');
      expect(day.items).toEqual([]);
    });
  });

  it('cambia los días por semana entre 1 y 7', async () => {
    const { routine, user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Aumentar días por semana' }));
    await waitFor(async () => expect((await stored(routine.id)).daysPerWeek).toBe(4));
    await routineRepository.update(routine.id, { daysPerWeek: 7 });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Aumentar días por semana' })).toBeDisabled(),
    );
  });

  it('renombra la rutina y no admite un nombre vacío', async () => {
    const { routine, user } = await setup();
    const input = screen.getByLabelText('Nombre de la rutina');
    await user.clear(input);
    expect(await screen.findByText('Escribe un nombre.')).toBeVisible();
    await user.tab();
    expect((await stored(routine.id)).name).toBe('PPL');
    expect(screen.getByLabelText('Nombre de la rutina')).toHaveValue('PPL');

    await user.clear(screen.getByLabelText('Nombre de la rutina'));
    await user.type(screen.getByLabelText('Nombre de la rutina'), 'Torso / Pierna');
    await user.tab();
    await waitFor(async () => expect((await stored(routine.id)).name).toBe('Torso / Pierna'));
  });
});

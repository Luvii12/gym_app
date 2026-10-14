import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { db, routineRepository } from '../../db';
import type { Exercise, RoutineItem } from '../../domain';
import { RoutineDayEditorPage } from './RoutineDayEditorPage';

const exercise = (id: string, name: string, extra: Partial<Exercise> = {}): Exercise => ({
  id,
  name,
  muscleGroup: 'chest',
  equipment: 'barbell',
  isCustom: false,
  ...extra,
});

const item = (exerciseId: string): RoutineItem => ({
  exerciseId,
  sets: 3,
  repsMin: 8,
  repsMax: 10,
  restSec: 90,
});

beforeEach(async () => {
  await db.routines.clear();
  await db.exercises.clear();
  await db.settings.clear();
  await db.exercises.bulkPut([
    exercise('bench', 'Press banca'),
    exercise('squat', 'Sentadilla', { muscleGroup: 'legs' }),
    exercise('row', 'Remo con barra', { muscleGroup: 'back' }),
    exercise('old', 'Ejercicio viejo', { isCustom: true, archivedAt: 1 }),
  ]);
});

async function setup(items: RoutineItem[] = [], kind: 'training' | 'rest' = 'training') {
  const routine = await routineRepository.create({ name: 'PPL' });
  await routineRepository.update(routine.id, {
    days: [{ id: 'd1', name: 'Push A', kind, items }],
  });
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[`/rutinas/${routine.id}/dias/d1`]}>
      <Routes>
        <Route path="/rutinas/:routineId/dias/:dayId" element={<RoutineDayEditorPage />} />
      </Routes>
    </MemoryRouter>,
  );
  return { routine, user };
}

const storedItems = async (id: string) => (await routineRepository.get(id))!.days[0]!.items;
const order = async (id: string) => (await storedItems(id)).map((i) => i.exerciseId);

describe('RoutineDayEditorPage', () => {
  it('muestra un mensaje con enlace si el día no existe', async () => {
    const routine = await routineRepository.create({ name: 'PPL' });
    render(
      <MemoryRouter initialEntries={[`/rutinas/${routine.id}/dias/nada`]}>
        <Routes>
          <Route path="/rutinas/:routineId/dias/:dayId" element={<RoutineDayEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText('Día no encontrado')).toBeVisible();
    expect(screen.getByRole('link', { name: /Volver a la rutina/ })).toHaveAttribute(
      'href',
      `/rutinas/${routine.id}`,
    );
  });

  it('un día de descanso no abre editor', async () => {
    await setup([], 'rest');
    expect(await screen.findByText('Día de descanso')).toBeVisible();
  });

  it('añade varios ejercicios con valores por defecto y marca los ya presentes', async () => {
    const { routine, user } = await setup();
    await user.click(
      await screen.findByRole('button', { name: /Añadir ejercicio desde catálogo/ }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByText('Ejercicio viejo')).toBeNull();

    await user.click(within(dialog).getByRole('button', { name: 'Añadir Press banca' }));
    await user.click(within(dialog).getByRole('button', { name: 'Añadir Sentadilla' }));
    expect(
      await within(dialog).findByRole('button', { name: 'Press banca, ya está en el día' }),
    ).toBeDisabled();

    await waitFor(async () => expect(await order(routine.id)).toEqual(['bench', 'squat']));
    expect((await storedItems(routine.id))[0]).toEqual(item('bench'));
    expect(screen.getByText('2 ejercicios · 6 series')).toBeVisible();
  });

  it('filtra por grupo y por texto en el selector', async () => {
    const { user } = await setup();
    await user.click(
      await screen.findByRole('button', { name: /Añadir ejercicio desde catálogo/ }),
    );
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Piernas' }));
    expect(within(dialog).getByText('Sentadilla')).toBeVisible();
    expect(within(dialog).queryByText('Press banca')).toBeNull();
    await user.click(within(dialog).getByRole('button', { name: 'Todos' }));
    await user.type(within(dialog).getByRole('searchbox'), 'remo');
    expect(within(dialog).queryByText('Press banca')).toBeNull();
    expect(within(dialog).getByText('Remo con barra')).toBeVisible();
  });

  it('cambia series, descanso y repeticiones y lo guarda', async () => {
    const { routine, user } = await setup([item('bench')]);
    await user.click(await screen.findByRole('button', { name: 'Aumentar series de Press banca' }));
    await user.click(screen.getByRole('button', { name: 'Aumentar descanso de Press banca' }));
    expect(await screen.findByText('1:45')).toBeVisible();
    const max = screen.getByLabelText('Repeticiones máximo de Press banca');
    await user.clear(max);
    await user.type(max, '12');

    await waitFor(async () => {
      expect((await storedItems(routine.id))[0]).toMatchObject({
        sets: 4,
        restSec: 105,
        repsMin: 8,
        repsMax: 12,
      });
    });
  });

  it('valida el rango de repeticiones en línea y no guarda un rango inválido', async () => {
    const { routine, user } = await setup([item('bench')]);
    const min = await screen.findByLabelText('Repeticiones mínimo de Press banca');
    await user.clear(min);
    await user.type(min, '15');
    expect(await screen.findByRole('alert')).toHaveTextContent('El mínimo no puede ser mayor');
    expect((await storedItems(routine.id))[0]?.repsMin).not.toBe(15);

    await user.tab();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText('Repeticiones mínimo de Press banca')).toHaveValue('1');
  });

  it('quita un ejercicio y permite deshacer en su posición', async () => {
    const { routine, user } = await setup([item('bench'), item('squat'), item('row')]);
    await user.click(await screen.findByRole('button', { name: 'Quitar Sentadilla' }));
    await waitFor(async () => expect(await order(routine.id)).toEqual(['bench', 'row']));
    await user.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(async () => expect(await order(routine.id)).toEqual(['bench', 'squat', 'row']));
  });

  it('reordena con subir y bajar', async () => {
    const { routine, user } = await setup([item('bench'), item('squat'), item('row')]);
    expect(await screen.findByRole('button', { name: 'Subir Press banca' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Bajar Press banca' }));
    await waitFor(async () => expect(await order(routine.id)).toEqual(['squat', 'bench', 'row']));
    await user.click(screen.getByRole('button', { name: 'Subir Remo con barra' }));
    await waitFor(async () => expect(await order(routine.id)).toEqual(['squat', 'row', 'bench']));
  });

  it('muestra los archivados por su nombre y "Ejercicio eliminado" si ya no existe', async () => {
    await setup([item('old'), item('fantasma')]);
    expect(await screen.findByRole('heading', { name: /Ejercicio viejo/ })).toBeVisible();
    expect(screen.getByRole('heading', { name: /Ejercicio eliminado/ })).toBeVisible();
  });
});

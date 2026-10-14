import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { db, sessionRepository } from '../../db';
import { startSession, type Exercise, type RoutineDay } from '../../domain';
import { WorkoutPage } from './WorkoutPage';
import { useRestTimer } from './useRestTimer';

const row: Exercise = {
  id: 'barbell-row',
  name: 'Remo con barra',
  muscleGroup: 'back',
  equipment: 'barbell',
  isCustom: false,
};
const day: RoutineDay = {
  id: 'day-1',
  name: 'Pull (Día B)',
  kind: 'training',
  items: [{ exerciseId: row.id, sets: 2, repsMin: 8, repsMax: 10, restSec: 90 }],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/entreno']}>
      <Routes>
        <Route path="/entreno" element={<WorkoutPage />} />
        <Route path="/" element={<p>Pantalla Hoy</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await db.sessions.clear();
  await db.exercises.clear();
  await db.exercises.put(row);
  useRestTimer.getState().stop();
});

describe('WorkoutPage', () => {
  it('sin entreno en curso vuelve a Hoy', async () => {
    renderPage();
    expect(await screen.findByText('Pantalla Hoy')).toBeVisible();
  });

  it('completar una serie la guarda y arranca el descanso', async () => {
    await sessionRepository.save(startSession({ id: 's1', now: Date.now(), day, routineId: 'r1' }));
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('0 / 2 series')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Completar serie 1 de Remo con barra' }));

    await waitFor(async () => {
      const saved = await sessionRepository.getActive();
      expect(saved?.sets[0]?.completedAt).toBeDefined();
    });
    expect(await screen.findByText('1 / 2 series')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Abrir temporizador de descanso' })).toBeVisible();
    expect(useRestTimer.getState().durationSec).toBe(90);

    // Desmarcar no arranca otro descanso.
    useRestTimer.getState().stop();
    await user.click(screen.getByRole('button', { name: 'Desmarcar serie 1 de Remo con barra' }));
    await screen.findByText('0 / 2 series');
    expect(useRestTimer.getState().endsAt).toBeNull();
  });

  it('el stepper de peso guarda el cambio', async () => {
    await sessionRepository.save(startSession({ id: 's1', now: Date.now(), day, routineId: 'r1' }));
    const user = userEvent.setup();
    renderPage();
    await user.click(
      (await screen.findAllByRole('button', { name: /Aumentar peso de la serie 1/ }))[0]!,
    );
    await waitFor(async () => {
      expect((await sessionRepository.getActive())?.sets[0]?.weightKg).toBe(2.5);
    });
  });

  it('terminar guarda el entreno y vuelve a Hoy', async () => {
    await sessionRepository.save(startSession({ id: 's1', now: Date.now(), day, routineId: 'r1' }));
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole('button', { name: 'Completar serie 1 de Remo con barra' }),
    );
    await user.click(screen.getByRole('button', { name: 'Terminar' }));
    await user.click(await screen.findByRole('button', { name: 'Terminar entreno' }));

    expect(await screen.findByText('Pantalla Hoy')).toBeVisible();
    expect(await sessionRepository.getActive()).toBeUndefined();
    const [saved] = await sessionRepository.listFinished();
    expect(saved?.sets).toHaveLength(1);
  });

  it('añadir serie y añadir ejercicio al vuelo se guardan', async () => {
    await db.exercises.put({
      id: 'squat',
      name: 'Sentadilla',
      muscleGroup: 'legs',
      equipment: 'barbell',
      isCustom: false,
    });
    await sessionRepository.save(startSession({ id: 's1', now: Date.now(), day, routineId: 'r1' }));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Añadir serie' }));
    expect(await screen.findByText('0 / 3 series')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Añadir ejercicio' }));
    await user.click(await screen.findByRole('button', { name: 'Añadir Sentadilla' }));
    await waitFor(async () => {
      const saved = await sessionRepository.getActive();
      expect(saved?.sets.filter((s) => s.exerciseId === 'squat').length).toBeGreaterThan(0);
      expect(saved?.sets.filter((s) => s.exerciseId === row.id)).toHaveLength(3);
    });
    expect(await screen.findByRole('group', { name: 'Sentadilla' })).toBeVisible();
  });

  it('quitar ejercicio pide confirmación y lo borra de la sesión', async () => {
    await sessionRepository.save(startSession({ id: 's1', now: Date.now(), day, routineId: 'r1' }));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Opciones de Remo con barra' }));
    await user.click(await screen.findByRole('button', { name: 'Quitar ejercicio' }));
    // Cancelar no quita nada.
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('group', { name: 'Remo con barra' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Opciones de Remo con barra' }));
    await user.click(await screen.findByRole('button', { name: 'Quitar ejercicio' }));
    const buttons = await screen.findAllByRole('button', { name: 'Quitar ejercicio' });
    await user.click(buttons[buttons.length - 1]!);

    await waitFor(async () => {
      expect((await sessionRepository.getActive())?.sets).toHaveLength(0);
    });
    expect(await screen.findByText('Entreno vacío')).toBeVisible();
  });

  it('la hoja de descanso ajusta el tiempo con -15, +15 y +30 y permite saltar', async () => {
    await sessionRepository.save(startSession({ id: 's1', now: Date.now(), day, routineId: 'r1' }));
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole('button', { name: 'Completar serie 1 de Remo con barra' }),
    );
    await user.click(screen.getByRole('button', { name: 'Abrir temporizador de descanso' }));
    expect(await screen.findByText('Serie 1 completada')).toBeVisible();
    expect(screen.getByText(/Siguiente: Serie 2/)).toBeVisible();

    const duration = () => useRestTimer.getState().durationSec;
    expect(duration()).toBe(90);
    await user.click(screen.getByRole('button', { name: '+ 15 s' }));
    expect(duration()).toBe(105);
    await user.click(screen.getByRole('button', { name: '+ 30 s' }));
    expect(duration()).toBe(135);
    await user.click(screen.getByRole('button', { name: '− 15 s' }));
    expect(duration()).toBe(120);

    await user.click(screen.getByRole('button', { name: /Saltar descanso/ }));
    expect(useRestTimer.getState().endsAt).toBeNull();
    expect(screen.queryByRole('button', { name: 'Abrir temporizador de descanso' })).toBeNull();
  });

  it('descartar borra la sesión sin guardarla en el historial', async () => {
    await sessionRepository.save(startSession({ id: 's1', now: Date.now(), day, routineId: 'r1' }));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Terminar' }));
    await user.click(await screen.findByRole('button', { name: 'Descartar entreno' }));
    const buttons = await screen.findAllByRole('button', { name: 'Descartar entreno' });
    await user.click(buttons[buttons.length - 1]!);

    expect(await screen.findByText('Pantalla Hoy')).toBeVisible();
    expect(await sessionRepository.getActive()).toBeUndefined();
    expect(await sessionRepository.listFinished()).toHaveLength(0);
  });

  describe('récords', () => {
    const doneSession = (weightKg: number) => ({
      id: 'old',
      name: 'Antiguo',
      startedAt: 1000,
      endedAt: 5000,
      sets: [{ exerciseId: row.id, setIndex: 0, weightKg, reps: 1, completedAt: 2000 }],
    });

    it('marca PR y avisa al batir el récord', async () => {
      await sessionRepository.save(doneSession(100));
      await sessionRepository.save({
        id: 's2',
        name: 'Hoy',
        startedAt: Date.now(),
        sets: [{ exerciseId: row.id, setIndex: 0, weightKg: 105, reps: 1 }],
      });
      const user = userEvent.setup();
      renderPage();
      await user.click(
        await screen.findByRole('button', { name: 'Completar serie 1 de Remo con barra' }),
      );
      expect(await screen.findByText('¡Nuevo PR en Remo con barra!')).toBeVisible();
      expect(await screen.findByText('PR')).toBeVisible();
      await user.click(screen.getByRole('button', { name: 'Desmarcar serie 1 de Remo con barra' }));
      await waitFor(() => expect(screen.queryByText('PR')).toBeNull());
    });

    it('no marca PR al igualar el récord', async () => {
      await sessionRepository.save(doneSession(100));
      await sessionRepository.save({
        id: 's2',
        name: 'Hoy',
        startedAt: Date.now(),
        sets: [{ exerciseId: row.id, setIndex: 0, weightKg: 100, reps: 1 }],
      });
      const user = userEvent.setup();
      renderPage();
      await user.click(
        await screen.findByRole('button', { name: 'Completar serie 1 de Remo con barra' }),
      );
      expect(await screen.findByText('1 / 1 series')).toBeVisible();
      expect(screen.queryByText('PR')).toBeNull();
      expect(screen.queryByText(/Nuevo PR/)).toBeNull();
    });
  });
});

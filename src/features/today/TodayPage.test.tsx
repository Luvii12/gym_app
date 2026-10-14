import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { db, routineRepository, sessionRepository } from '../../db';
import type { Exercise } from '../../domain';
import { TodayPage } from './TodayPage';

const bench: Exercise = {
  id: 'bench',
  name: 'Press banca',
  muscleGroup: 'chest',
  equipment: 'barbell',
  isCustom: false,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/entreno" element={<p>Pantalla entreno</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await db.sessions.clear();
  await db.routines.clear();
  await db.settings.clear();
  await db.exercises.clear();
  await db.exercises.put(bench);
});

describe('TodayPage', () => {
  it('sin rutina ofrece crear una y entreno libre', async () => {
    renderPage();
    expect(await screen.findByText('Sin rutina activa')).toBeVisible();
    expect(screen.getByRole('button', { name: /Entreno libre/ })).toBeVisible();
  });

  it('"Empezar entreno" crea la sesión del siguiente día y abre el entreno', async () => {
    await routineRepository.create({
      name: 'PPL',
      days: [
        {
          id: 'd1',
          name: 'Push',
          kind: 'training',
          items: [{ exerciseId: 'bench', sets: 3, repsMin: 8, repsMax: 10, restSec: 90 }],
        },
      ],
    });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Push' })).toBeVisible();
    expect(screen.getByText('1 ejercicio')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Empezar entreno' }));

    expect(await screen.findByText('Pantalla entreno')).toBeVisible();
    const active = await sessionRepository.getActive();
    expect(active?.name).toBe('Push');
    expect(active?.sets).toHaveLength(3);
  });

  it('con un entreno en curso ofrece continuar', async () => {
    await sessionRepository.save({ id: 's1', name: 'Libre', startedAt: 1, sets: [] });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('Pantalla entreno')).toBeVisible();
  });

  it('"Entreno libre" crea una sesión vacía y abre el entreno', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: /Entreno libre/ }));

    expect(await screen.findByText('Pantalla entreno')).toBeVisible();
    const active = await sessionRepository.getActive();
    expect(active?.routineDayId).toBeUndefined();
    expect(active?.sets).toHaveLength(0);
  });

  it('sin entrenos terminados no hay último entreno ni racha', async () => {
    await routineRepository.create({ name: 'PPL', daysPerWeek: 1, days: [] });
    renderPage();
    await screen.findByRole('heading', { name: 'Listo para entrenar' });
    expect(screen.queryByText('Último entreno')).toBeNull();
    expect(screen.queryByText(/Racha de/)).toBeNull();
  });

  it('muestra el último entreno con su PR y la racha', async () => {
    await routineRepository.create({ name: 'PPL', daysPerWeek: 1, days: [] });
    const now = Date.now();
    const make = (id: string, startedAt: number, weightKg: number) => ({
      id,
      name: id === 'old' ? 'Antiguo' : 'Push',
      startedAt,
      endedAt: startedAt + 45 * 60000,
      sets: [{ exerciseId: 'bench', setIndex: 0, weightKg, reps: 1, completedAt: startedAt + 1 }],
    });
    await sessionRepository.save(make('old', now - 30 * 86400000, 100));
    await sessionRepository.save(make('new', now, 103.5));
    renderPage();

    expect(await screen.findByText('Último entreno')).toBeVisible();
    expect(screen.getByText(/PR · Press banca \+3,5 kg/)).toBeVisible();
    expect(screen.getByText(/45 min/)).toBeVisible();
    expect(screen.getByRole('link', { name: /Último entreno/ })).toHaveAttribute(
      'href',
      '/progreso/historial/new',
    );
    expect(screen.getByText('Racha de 1 semana')).toBeVisible();
  });
});

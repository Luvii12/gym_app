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
});

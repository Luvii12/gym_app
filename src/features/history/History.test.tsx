import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { db, sessionRepository } from '../../db';
import type { Exercise, WorkoutSession } from '../../domain';
import { HistoryPage } from './HistoryPage';
import { HistorySessionPage } from './HistorySessionPage';

const row: Exercise = {
  id: 'barbell-row',
  name: 'Remo con barra',
  muscleGroup: 'back',
  equipment: 'barbell',
  isCustom: false,
};
const start = new Date(2026, 9, 14, 18, 30).getTime();
const session: WorkoutSession = {
  id: 's1',
  name: 'Pull (Día B)',
  startedAt: start,
  endedAt: start + 45 * 60000,
  sets: [
    { exerciseId: row.id, setIndex: 0, weightKg: 60, reps: 10, completedAt: start + 1000 },
    { exerciseId: row.id, setIndex: 1, weightKg: 62.5, reps: 8, completedAt: start + 2000 },
  ],
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/progreso/historial" element={<HistoryPage />} />
        <Route path="/progreso/historial/:sessionId" element={<HistorySessionPage />} />
        <Route path="/progreso" element={<p>Pantalla Progreso</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await db.sessions.clear();
  await db.exercises.clear();
  await db.exercises.put(row);
});

describe('HistoryPage', () => {
  it('lista las sesiones con resumen', async () => {
    await sessionRepository.save(session);
    renderAt('/progreso/historial');
    expect(await screen.findByText('Pull (Día B)')).toBeVisible();
    expect(screen.getByText(/45 min · 2 series · 1100 kg/)).toBeVisible();
  });

  it('muestra el estado vacío', async () => {
    renderAt('/progreso/historial');
    expect(await screen.findByText('Aún no hay entrenos')).toBeVisible();
  });
});

describe('HistorySessionPage', () => {
  it('muestra el detalle', async () => {
    await sessionRepository.save(session);
    renderAt('/progreso/historial/s1');
    expect(await screen.findByText('Remo con barra')).toBeVisible();
    expect(screen.getByText('60 kg × 10')).toBeVisible();
    expect(screen.getByText('62,5 kg × 8')).toBeVisible();
  });

  it('sesión inexistente', async () => {
    renderAt('/progreso/historial/nope');
    expect(await screen.findByText('Entreno no encontrado')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ir al historial' })).toBeVisible();
  });

  it('editar una serie la guarda y quitar la última pide borrar', async () => {
    await sessionRepository.save(session);
    const user = userEvent.setup();
    renderAt('/progreso/historial/s1');
    await user.click(await screen.findByRole('button', { name: 'Editar' }));
    await user.click(screen.getByRole('button', { name: /Aumentar peso de la serie 1/ }));
    await waitFor(async () => {
      expect((await sessionRepository.get('s1'))?.sets[0]?.weightKg).toBe(62.5);
    });

    await user.click(screen.getByRole('button', { name: 'Quitar Remo con barra' }));
    expect(await screen.findByText('¿Borrar entreno?')).toBeVisible();
    expect((await sessionRepository.get('s1'))?.sets).toHaveLength(0);
  });

  it('borrar el entreno vuelve a la lista', async () => {
    await sessionRepository.save(session);
    const user = userEvent.setup();
    renderAt('/progreso/historial/s1');
    await user.click(await screen.findByRole('button', { name: 'Borrar entreno' }));
    await user.click(screen.getAllByRole('button', { name: 'Borrar entreno' }).at(-1)!);
    expect(await screen.findByText('Aún no hay entrenos')).toBeVisible();
    expect(await sessionRepository.get('s1')).toBeUndefined();
  });
});

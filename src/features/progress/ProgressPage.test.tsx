import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { db, sessionRepository } from '../../db';
import type { Exercise, WorkoutSession } from '../../domain';
import { ProgressPage } from './ProgressPage';

const bench: Exercise = {
  id: 'bench',
  name: 'Press banca',
  muscleGroup: 'chest',
  equipment: 'barbell',
  isCustom: false,
};
const squat: Exercise = {
  id: 'squat',
  name: 'Sentadilla',
  muscleGroup: 'legs',
  equipment: 'barbell',
  isCustom: false,
};

const DAY = 86400000;
function session(
  id: string,
  startedAt: number,
  exerciseId: string,
  weightKg: number,
  reps = 1,
): WorkoutSession {
  return {
    id,
    name: id,
    startedAt,
    endedAt: startedAt + 3600000,
    sets: [{ exerciseId, setIndex: 0, weightKg, reps, completedAt: startedAt + 1000 }],
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ProgressPage />
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await db.sessions.clear();
  await db.exercises.clear();
  await db.exercises.bulkPut([bench, squat]);
});

describe('ProgressPage', () => {
  it('muestra el estado vacío sin entrenos', async () => {
    renderPage();
    expect(await screen.findByText('Todavía no hay datos')).toBeVisible();
    expect(screen.queryByText('Volumen semanal total')).toBeNull();
  });

  it('muestra récord, variación, MÁX y cambia de ejercicio', async () => {
    const now = Date.now();
    await sessionRepository.save(session('a', now - 120 * DAY, 'bench', 100));
    await sessionRepository.save(session('b', now - 3 * DAY, 'bench', 110));
    await sessionRepository.save(session('c', now - 10 * DAY, 'squat', 140));
    renderPage();

    expect(await screen.findByText('Histórico de cargas (1RM)')).toBeVisible();
    expect(screen.getByText('+10 % (3 meses)')).toBeVisible();
    expect(screen.getByText('Récord actual estimado')).toBeVisible();
    expect(screen.getByText('110')).toBeVisible();
    expect(screen.getByText('Volumen semanal total')).toBeVisible();
    expect(screen.getByText('MÁX')).toBeVisible();
    expect(screen.queryByText('Todavía no hay datos')).toBeNull();

    await userEvent.selectOptions(screen.getByLabelText('Ejercicio'), 'squat');
    expect(screen.getByText('140')).toBeVisible();
    expect(screen.queryByText(/% \(3 meses\)/)).toBeNull();
  });
});

import type { RoutineDay } from './routine';
import type { WorkoutSession } from './session';
import {
  addExercise,
  addSet,
  exerciseOrder,
  finishSession,
  formatElapsed,
  lastPerformances,
  planDay,
  removeExercise,
  removeSet,
  restRemainingSec,
  sessionProgress,
  setsOf,
  startSession,
  toggleSet,
  updateSet,
} from './workout';

const day: RoutineDay = {
  id: 'd1',
  name: 'Pull (Día B)',
  kind: 'training',
  items: [
    { exerciseId: 'row', sets: 2, repsMin: 8, repsMax: 10, restSec: 90 },
    { exerciseId: 'curl', sets: 1, repsMin: 10, repsMax: 12, restSec: 60 },
  ],
};

const fresh = () => startSession({ id: 's1', now: 1000, day, routineId: 'r1' });

describe('startSession', () => {
  it('crea las series previstas sin marcar, con reps mínimas y peso 0 sin historial', () => {
    const s = fresh();
    expect(s).toMatchObject({
      name: 'Pull (Día B)',
      routineId: 'r1',
      routineDayId: 'd1',
      startedAt: 1000,
    });
    expect(s.sets).toHaveLength(3);
    expect(s.sets[0]).toEqual({ exerciseId: 'row', setIndex: 0, weightKg: 0, reps: 8 });
    expect(s.targets?.curl).toEqual({ repsMin: 10, repsMax: 12, restSec: 60 });
  });

  it('parte del peso y las reps de la última vez', () => {
    const s = startSession({ id: 's', now: 0, day, last: { row: { weightKg: 82.5, reps: 9 } } });
    expect(setsOf(s, 'row').map((x) => [x.weightKg, x.reps])).toEqual([
      [82.5, 9],
      [82.5, 9],
    ]);
  });

  it('un entreno libre no tiene día ni series', () => {
    const s = startSession({ id: 's', now: 0 });
    expect(s).toMatchObject({ name: 'Entreno libre', sets: [] });
    expect(s.routineDayId).toBeUndefined();
  });
});

describe('lastPerformances', () => {
  const done = (id: string, endedAt: number, weightKg: number, setIndex = 0): WorkoutSession => ({
    id,
    name: 'x',
    startedAt: 0,
    endedAt,
    sets: [{ exerciseId: 'row', setIndex, weightKg, reps: 8, completedAt: endedAt }],
  });

  it('usa la sesión terminada más reciente e ignora en curso y series sin hacer', () => {
    const active: WorkoutSession = { ...done('a', 0, 999), endedAt: undefined };
    const pending: WorkoutSession = {
      ...done('p', 300, 500),
      sets: [{ exerciseId: 'row', setIndex: 0, weightKg: 500, reps: 1 }],
    };
    const result = lastPerformances([done('old', 100, 60), done('new', 200, 70), active, pending]);
    expect(result.row).toEqual({ weightKg: 70, reps: 8 });
  });

  it('dentro de una sesión toma la última serie hecha', () => {
    const s = done('s', 100, 60);
    s.sets.push({ exerciseId: 'row', setIndex: 2, weightKg: 70, reps: 6, completedAt: 100 });
    expect(lastPerformances([s]).row).toEqual({ weightKg: 70, reps: 6 });
  });
});

describe('edición de series', () => {
  it('toggleSet marca y desmarca', () => {
    const marked = toggleSet(fresh(), 'row', 0, 5000);
    expect(setsOf(marked, 'row')[0]?.completedAt).toBe(5000);
    expect(sessionProgress(marked)).toEqual({ done: 1, total: 3 });
    const undone = toggleSet(marked, 'row', 0, 6000);
    expect('completedAt' in setsOf(undone, 'row')[0]!).toBe(false);
  });

  it('updateSet acota el peso y redondea las reps', () => {
    const s = updateSet(fresh(), 'row', 1, { weightKg: -5, reps: 7.6 });
    expect(setsOf(s, 'row')[1]).toMatchObject({ weightKg: 0, reps: 8 });
  });

  it('addSet copia la anterior y se queda junto a su ejercicio', () => {
    const s = addSet(updateSet(fresh(), 'row', 1, { weightKg: 50, reps: 6 }), 'row');
    expect(setsOf(s, 'row')[2]).toEqual({ exerciseId: 'row', setIndex: 2, weightKg: 50, reps: 6 });
    expect(s.sets.map((x) => x.exerciseId)).toEqual(['row', 'row', 'row', 'curl']);
  });

  it('removeSet solo quita series sin hacer, renumera y deja siempre una', () => {
    const s = removeSet(fresh(), 'row', 0);
    expect(setsOf(s, 'row').map((x) => x.setIndex)).toEqual([0]);
    expect(removeSet(s, 'row', 0)).toBe(s);
    const done = toggleSet(fresh(), 'row', 0, 1);
    expect(removeSet(done, 'row', 0)).toBe(done);
  });
});

describe('ejercicios al vuelo', () => {
  it('addExercise añade al final con una serie y no duplica', () => {
    const s = addExercise(fresh(), 'dips', { weightKg: 20, reps: 12 });
    expect(exerciseOrder(s)).toEqual(['row', 'curl', 'dips']);
    expect(setsOf(s, 'dips')).toEqual([
      { exerciseId: 'dips', setIndex: 0, weightKg: 20, reps: 12 },
    ]);
    expect(addExercise(s, 'dips')).toBe(s);
  });

  it('removeExercise quita series y objetivo', () => {
    const s = removeExercise(fresh(), 'row');
    expect(exerciseOrder(s)).toEqual(['curl']);
    expect(s.targets).not.toHaveProperty('row');
  });
});

describe('finishSession', () => {
  it('descarta las series sin hacer y fija la hora de fin', () => {
    const s = finishSession(toggleSet(fresh(), 'row', 0, 2000), 9000);
    expect(s.endedAt).toBe(9000);
    expect(s.sets).toHaveLength(1);
    expect(Object.keys(s.targets ?? {})).toEqual(['row']);
  });
});

describe('planDay', () => {
  it('resume ejercicios, series, duración estimada y peso previo', () => {
    const plan = planDay(day, { row: { weightKg: 70, reps: 8 } });
    expect(plan).toMatchObject({ exercises: 2, sets: 3, estimatedMinutes: 6 });
    expect(plan.items[0]).toEqual({ exerciseId: 'row', sets: 2, weightKg: 70 });
    expect(plan.items[1]).toEqual({ exerciseId: 'curl', sets: 1 });
  });
});

describe('tiempos', () => {
  it('formatElapsed', () => {
    expect(formatElapsed(27 * 60_000 + 26_000)).toBe('27:26');
    expect(formatElapsed(3_725_000)).toBe('1:02:05');
    expect(formatElapsed(-5)).toBe('00:00');
  });

  it('restRemainingSec redondea hacia arriba y no baja de 0', () => {
    expect(restRemainingSec(10_000, 8_500)).toBe(2);
    expect(restRemainingSec(10_000, 12_000)).toBe(0);
  });
});

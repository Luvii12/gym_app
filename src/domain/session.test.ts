import {
  completedSets,
  deleteLoggedSet,
  isSessionActive,
  sessionDuration,
  type LoggedSet,
  type WorkoutSession,
} from './session';

const set = (overrides: Partial<LoggedSet> = {}): LoggedSet => ({
  exerciseId: 'barbell-bench-press',
  setIndex: 0,
  weightKg: 80,
  reps: 8,
  ...overrides,
});

const session = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 's1',
  name: 'Push A',
  startedAt: 1_000,
  sets: [],
  ...overrides,
});

describe('isSessionActive', () => {
  it('una sesión sin hora de fin sigue en curso', () => {
    expect(isSessionActive(session())).toBe(true);
  });

  it('una sesión con hora de fin ya terminó', () => {
    expect(isSessionActive(session({ endedAt: 5_000 }))).toBe(false);
  });
});

describe('completedSets', () => {
  it('solo cuenta las series marcadas como hechas', () => {
    const s = session({
      sets: [
        set({ setIndex: 0, completedAt: 2_000 }),
        set({ setIndex: 1, completedAt: 3_000 }),
        set({ setIndex: 2 }),
      ],
    });
    expect(completedSets(s)).toHaveLength(2);
    expect(completedSets(s).every((x) => x.completedAt !== undefined)).toBe(true);
  });

  it('devuelve vacío si no hay series hechas', () => {
    expect(completedSets(session({ sets: [set()] }))).toEqual([]);
  });
});

describe('sessionDuration', () => {
  it('es la diferencia entre fin e inicio', () => {
    expect(sessionDuration(session({ startedAt: 1_000, endedAt: 4_601_000 }))).toBe(4_600_000);
  });

  it('una sesión en curso no tiene duración', () => {
    expect(sessionDuration(session())).toBeUndefined();
  });
});

describe('deleteLoggedSet', () => {
  const target = { repsMin: 8, repsMax: 10, restSec: 90 };
  const base = () =>
    session({
      endedAt: 9_000,
      targets: { a: target, b: target },
      sets: [
        set({ exerciseId: 'a', setIndex: 0, completedAt: 1 }),
        set({ exerciseId: 'a', setIndex: 1, weightKg: 70, completedAt: 2 }),
        set({ exerciseId: 'b', setIndex: 0, completedAt: 3 }),
      ],
    });

  it('quita una serie hecha y renumera las siguientes', () => {
    const s = deleteLoggedSet(base(), 'a', 0);
    expect(s.sets.filter((x) => x.exerciseId === 'a')).toEqual([
      expect.objectContaining({ setIndex: 0, weightKg: 70 }),
    ]);
  });

  it('si era la última del ejercicio, quita también su objetivo', () => {
    const s = deleteLoggedSet(base(), 'b', 0);
    expect(s.sets.some((x) => x.exerciseId === 'b')).toBe(false);
    expect(s.targets).toEqual({ a: target });
  });

  it('una serie inexistente no cambia nada', () => {
    const s = base();
    expect(deleteLoggedSet(s, 'a', 9)).toBe(s);
  });
});

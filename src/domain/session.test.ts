import { completedSets, isSessionActive, type LoggedSet, type WorkoutSession } from './session';

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

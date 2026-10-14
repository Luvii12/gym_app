import {
  estimateOneRepMax,
  exerciseHistory,
  isNewRecord,
  oneRepMaxChange,
  personalRecords,
  sessionVolume,
  startOfWeek,
  weeklyVolume,
  weekStreak,
} from './progress';
import type { LoggedSet, WorkoutSession } from './session';

const BENCH = 'barbell-bench-press';
const SQUAT = 'barbell-back-squat';

/** Mediodía local del día indicado: robusto frente a la zona horaria. */
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

const done = (exerciseId: string, weightKg: number, reps: number, completedAt = 1): LoggedSet => ({
  exerciseId,
  setIndex: 0,
  weightKg,
  reps,
  completedAt,
});

let counter = 0;
const session = (
  startedAt: number,
  sets: LoggedSet[],
  overrides: Partial<WorkoutSession> = {},
): WorkoutSession => ({
  id: `s${++counter}`,
  name: 'Push A',
  startedAt,
  endedAt: startedAt + 3_600_000,
  sets: sets.map((s, i) => ({ ...s, setIndex: i, completedAt: s.completedAt && startedAt })),
  ...overrides,
});

describe('estimateOneRepMax (Epley)', () => {
  it('aplica peso × (1 + reps / 30)', () => {
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.667, 3);
    expect(estimateOneRepMax(80, 10)).toBeCloseTo(106.667, 3);
  });

  it('con una repetición el 1RM es el propio peso', () => {
    expect(estimateOneRepMax(140, 1)).toBe(140);
  });

  it('sin peso o sin repeticiones vale 0', () => {
    expect(estimateOneRepMax(0, 8)).toBe(0);
    expect(estimateOneRepMax(80, 0)).toBe(0);
  });
});

describe('sessionVolume', () => {
  it('suma peso × reps de las series hechas', () => {
    const s = session(at(2026, 10, 5), [done(BENCH, 80, 8), done(BENCH, 80, 6)]);
    expect(sessionVolume(s)).toBe(80 * 8 + 80 * 6);
  });

  it('ignora las series previstas sin hacer', () => {
    const planned: LoggedSet = { exerciseId: BENCH, setIndex: 0, weightKg: 100, reps: 10 };
    const s = session(at(2026, 10, 5), [done(BENCH, 50, 10), planned]);
    expect(sessionVolume({ ...s, sets: [s.sets[0]!, planned] })).toBe(500);
  });
});

describe('startOfWeek', () => {
  it('la semana empieza el lunes a las 00:00 locales', () => {
    // 2026-10-14 es miércoles.
    expect(startOfWeek(at(2026, 10, 14))).toBe(at(2026, 10, 12, 0));
    expect(startOfWeek(at(2026, 10, 12, 0))).toBe(at(2026, 10, 12, 0));
  });

  it('el domingo pertenece a la semana que empezó el lunes anterior', () => {
    expect(startOfWeek(at(2026, 10, 18, 23))).toBe(at(2026, 10, 12, 0));
  });
});

describe('exerciseHistory y récord', () => {
  const sessions = [
    session(at(2026, 9, 1), [done(BENCH, 80, 8), done(BENCH, 85, 5)]),
    session(at(2026, 9, 8), [done(BENCH, 90, 5)]),
    session(at(2026, 9, 15), [done(BENCH, 85, 5)]),
    session(at(2026, 9, 15), [done(SQUAT, 120, 5)]),
  ];

  it('da el mejor 1RM de cada sesión, en orden cronológico', () => {
    const points = exerciseHistory(sessions, BENCH);
    expect(points.map((p) => Math.round(p.oneRepMax))).toEqual([101, 105, 99]);
    expect(points.map((p) => p.at)).toEqual([at(2026, 9, 1), at(2026, 9, 8), at(2026, 9, 15)]);
  });

  it('ignora sesiones en curso y series sin hacer', () => {
    const active = session(at(2026, 9, 20), [done(BENCH, 200, 5)], { endedAt: undefined });
    expect(exerciseHistory([...sessions, active], BENCH)).toHaveLength(3);
  });

  it('sin datos del ejercicio devuelve una lista vacía', () => {
    expect(exerciseHistory(sessions, 'deadlift')).toEqual([]);
  });

  it('personalRecords: el PR de cada ejercicio y cuánto mejoró sobre el anterior', () => {
    const records = personalRecords(sessions);
    const bench = records.find((r) => r.exerciseId === BENCH)!;
    expect(bench).toMatchObject({ weightKg: 90, reps: 5, achievedAt: at(2026, 9, 8) });
    expect(bench.oneRepMax).toBeCloseTo(105, 5);
    // Antes del 8/9 el mejor era 80×8 = 101,33 (mejor que 85×5)
    expect(bench.improvement).toBeCloseTo(105 - 80 * (1 + 8 / 30), 5);
  });

  it('el primer PR de un ejercicio no tiene mejora', () => {
    const squat = personalRecords(sessions).find((r) => r.exerciseId === SQUAT)!;
    expect(squat.improvement).toBeUndefined();
  });

  it('si dos sesiones igualan el récord, cuenta la primera', () => {
    const tied = [
      session(at(2026, 9, 1), [done(BENCH, 100, 5)]),
      session(at(2026, 9, 8), [done(BENCH, 100, 5)]),
    ];
    expect(personalRecords(tied)[0]!.achievedAt).toBe(at(2026, 9, 1));
  });
});

describe('isNewRecord', () => {
  const history = [session(at(2026, 9, 1), [done(BENCH, 100, 5)])];

  it('es PR si supera el mejor 1RM anterior', () => {
    expect(isNewRecord(history, done(BENCH, 105, 5))).toBe(true);
  });

  it('igualar no es PR', () => {
    expect(isNewRecord(history, done(BENCH, 100, 5))).toBe(false);
  });

  it('la primera vez con un ejercicio no cuenta como PR', () => {
    expect(isNewRecord(history, done(SQUAT, 100, 5))).toBe(false);
  });

  it('una serie sin peso no es PR', () => {
    expect(isNewRecord(history, done(BENCH, 0, 20))).toBe(false);
  });
});

describe('oneRepMaxChange', () => {
  const points = [
    { sessionId: 'a', at: at(2026, 5, 1), oneRepMax: 100 },
    { sessionId: 'b', at: at(2026, 7, 1), oneRepMax: 105 },
    { sessionId: 'c', at: at(2026, 10, 1), oneRepMax: 110 },
  ];
  const now = at(2026, 10, 14);

  it('compara el mejor actual con el mejor que había hace 3 meses', () => {
    // Hace 3 meses = 14/7: el mejor entonces era 105 (el del 1/7).
    expect(oneRepMaxChange(points, now)).toEqual({ kg: 5, percent: (5 / 105) * 100 });
  });

  it('sin datos anteriores a la ventana no hay variación', () => {
    expect(oneRepMaxChange(points.slice(2), now)).toBeUndefined();
    expect(oneRepMaxChange([], now)).toBeUndefined();
  });
});

describe('weeklyVolume', () => {
  const sessions = [
    session(at(2026, 10, 5), [done(BENCH, 100, 10)]), // lunes, semana A
    session(at(2026, 10, 8), [done(BENCH, 50, 10)]), // jueves, semana A
    session(at(2026, 10, 14), [done(BENCH, 60, 10)]), // miércoles, semana C (la B queda vacía)
    session(at(2026, 10, 14), [done(BENCH, 999, 10)], { endedAt: undefined }),
  ];

  it('agrupa por semana (lunes) y rellena las semanas vacías hasta la actual', () => {
    const weeks = weeklyVolume(sessions, at(2026, 10, 14));
    expect(weeks).toEqual([
      { weekStart: at(2026, 10, 5, 0), volume: 1500, sessions: 2 },
      { weekStart: at(2026, 10, 12, 0), volume: 600, sessions: 1 },
    ]);
  });

  it('rellena huecos intermedios con volumen 0', () => {
    const gap = [
      session(at(2026, 9, 21), [done(BENCH, 100, 1)]),
      session(at(2026, 10, 12), [done(BENCH, 100, 1)]),
    ];
    const weeks = weeklyVolume(gap, at(2026, 10, 14));
    expect(weeks.map((w) => w.volume)).toEqual([100, 0, 0, 100]);
  });

  it('sin sesiones devuelve una lista vacía', () => {
    expect(weeklyVolume([], at(2026, 10, 14))).toEqual([]);
  });
});

describe('weekStreak', () => {
  const trained = (...days: [number, number, number][]) =>
    days.map(([y, m, d]) => session(at(y, m, d), [done(BENCH, 50, 5)]));

  it('cuenta semanas seguidas cumpliendo los días por semana', () => {
    const s = trained(
      [2026, 9, 28],
      [2026, 9, 30], // semana del 28/9: 2
      [2026, 10, 5],
      [2026, 10, 7], // semana del 5/10: 2
      [2026, 10, 12],
      [2026, 10, 13], // semana actual: 2
    );
    expect(weekStreak(s, 2, at(2026, 10, 14))).toBe(3);
  });

  it('la semana en curso sin cumplir aún no rompe la racha', () => {
    const s = trained([2026, 9, 28], [2026, 9, 30], [2026, 10, 5], [2026, 10, 7], [2026, 10, 12]);
    expect(weekStreak(s, 2, at(2026, 10, 14))).toBe(2);
  });

  it('una semana pasada sin cumplir corta la racha', () => {
    const s = trained([2026, 9, 28], [2026, 9, 30], [2026, 10, 5], [2026, 10, 12], [2026, 10, 13]);
    expect(weekStreak(s, 2, at(2026, 10, 14))).toBe(1);
  });

  it('sin sesiones la racha es 0', () => {
    expect(weekStreak([], 3, at(2026, 10, 14))).toBe(0);
  });

  it('las sesiones en curso o vacías no cuentan', () => {
    const s = [
      session(at(2026, 10, 5), [done(BENCH, 50, 5)], { endedAt: undefined }),
      session(at(2026, 10, 6), []),
    ];
    expect(weekStreak(s, 1, at(2026, 10, 14))).toBe(0);
  });
});

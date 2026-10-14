import { BACKUP_FORMAT, BACKUP_VERSION, buildBackup, parseBackup, summarizeBackup } from './backup';
import type { Exercise } from './exercise';
import type { Routine } from './routine';
import type { WorkoutSession } from './session';

const exercise: Exercise = {
  id: 'custom-1',
  name: 'Remo en TRX',
  muscleGroup: 'back',
  equipment: 'bodyweight',
  isCustom: true,
};
const routine: Routine = {
  id: 'r1',
  name: 'PPL',
  daysPerWeek: 3,
  createdAt: 1,
  days: [
    {
      id: 'd1',
      name: 'Push',
      kind: 'training',
      items: [{ exerciseId: 'custom-1', sets: 3, repsMin: 8, repsMax: 10, restSec: 90 }],
    },
  ],
};
const session: WorkoutSession = {
  id: 's1',
  name: 'Push',
  startedAt: 1_000,
  endedAt: 5_000,
  sets: [{ exerciseId: 'custom-1', setIndex: 0, weightKg: 20, reps: 8, completedAt: 2_000 }],
  targets: { 'custom-1': { repsMin: 8, repsMax: 10, restSec: 90 } },
};

type Mutable = {
  exercises: Exercise[];
  routines: Routine[];
  sessions: WorkoutSession[];
  settings: { key: string; value: unknown }[];
};

const data = () => ({
  exercises: [exercise],
  routines: [routine],
  sessions: [session],
  settings: [{ key: 'activeRoutineId', value: 'r1' }],
});

describe('buildBackup', () => {
  it('lleva formato, versión y fecha de exportación', () => {
    const backup = buildBackup(data(), 9_000);
    expect(backup).toMatchObject({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: 9_000,
    });
  });

  it('solo incluye ejercicios propios (los de la semilla se recargan solos)', () => {
    const seed: Exercise = { ...exercise, id: 'barbell-bench-press', isCustom: false };
    const backup = buildBackup({ ...data(), exercises: [seed, exercise] }, 1);
    expect(backup.exercises.map((e) => e.id)).toEqual(['custom-1']);
  });
});

describe('parseBackup', () => {
  const roundTrip = () => JSON.parse(JSON.stringify(buildBackup(data(), 9_000))) as unknown;

  it('acepta lo que exporta buildBackup, sin pérdidas', () => {
    const result = parseBackup(roundTrip());
    expect(result).toEqual({ ok: true, backup: buildBackup(data(), 9_000) });
  });

  it('rechaza lo que no es un objeto o no es de esta app', () => {
    expect(parseBackup(null).ok).toBe(false);
    expect(parseBackup([]).ok).toBe(false);
    expect(parseBackup({ format: 'otra-app', version: 1 }).ok).toBe(false);
  });

  it('rechaza una versión más nueva que la que entiende la app', () => {
    const result = parseBackup({ ...(roundTrip() as object), version: BACKUP_VERSION + 1 });
    expect(result).toMatchObject({ ok: false });
  });

  it('rechaza listas ausentes', () => {
    const rest = roundTrip() as Record<string, unknown>;
    delete rest.sessions;
    expect(parseBackup(rest).ok).toBe(false);
  });

  it.each([
    ['sesión sin id', (b: Mutable) => delete (b.sessions[0] as Partial<WorkoutSession>).id],
    ['serie con peso negativo', (b: Mutable) => (b.sessions[0].sets[0].weightKg = -5)],
    [
      'serie con repeticiones no numéricas',
      (b: Mutable) => (b.sessions[0].sets[0].reps = 'ocho' as never),
    ],
    [
      'ejercicio con grupo desconocido',
      (b: Mutable) => (b.exercises[0].muscleGroup = 'cuello' as never),
    ],
    ['rutina con días por semana fuera de 1–7', (b: Mutable) => (b.routines[0].daysPerWeek = 9)],
    ['día con tipo desconocido', (b: Mutable) => (b.routines[0].days[0].kind = 'otro' as never)],
    ['ajuste con valor no admitido', (b: Mutable) => (b.settings[0].value = { a: 1 } as never)],
    ['fechas no numéricas', (b: Mutable) => (b.sessions[0].startedAt = '2026-10-14' as never)],
  ])('rechaza %s', (_name, corrupt) => {
    const backup = roundTrip() as Mutable;
    corrupt(backup);
    const result = parseBackup(backup);
    expect(result.ok).toBe(false);
  });
});

describe('summarizeBackup', () => {
  it('cuenta entrenos terminados, rutinas y ejercicios propios', () => {
    const active: WorkoutSession = { ...session, id: 's2', endedAt: undefined };
    const backup = buildBackup({ ...data(), sessions: [session, active] }, 1);
    expect(summarizeBackup(backup)).toEqual({ workouts: 1, routines: 1, customExercises: 1 });
  });
});

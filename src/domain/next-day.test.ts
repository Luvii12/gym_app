import { nextDay } from './next-day';
import type { Routine, RoutineDay } from './routine';
import type { WorkoutSession } from './session';

const day = (id: string, kind: RoutineDay['kind'] = 'training'): RoutineDay => ({
  id,
  name: id,
  kind,
  items: [],
});

const routine = (days: RoutineDay[]): Routine => ({
  id: 'r1',
  name: 'PPL',
  daysPerWeek: 3,
  days,
  createdAt: 0,
});

const session = (
  routineDayId: string | undefined,
  startedAt: number,
  active = false,
): WorkoutSession => ({
  id: `s${startedAt}`,
  name: 'x',
  routineDayId,
  startedAt,
  endedAt: active ? undefined : startedAt + 1,
  sets: [],
});

const ppl = routine([day('push'), day('pull'), day('legs')]);

describe('nextDay', () => {
  it('sin sesiones propone el primer día de entreno', () => {
    expect(nextDay(ppl, [])?.id).toBe('push');
  });

  it('sin sesiones salta un descanso inicial', () => {
    expect(nextDay(routine([day('rest', 'rest'), day('push')]), [])?.id).toBe('push');
  });

  it('propone el día siguiente al de la última sesión completada', () => {
    expect(nextDay(ppl, [session('push', 1)])?.id).toBe('pull');
    expect(nextDay(ppl, [session('push', 1), session('pull', 2)])?.id).toBe('legs');
  });

  it('da la vuelta al llegar al final', () => {
    expect(nextDay(ppl, [session('legs', 1)])?.id).toBe('push');
  });

  it('usa la sesión más reciente aunque vengan desordenadas', () => {
    expect(nextDay(ppl, [session('pull', 5), session('push', 1)])?.id).toBe('legs');
  });

  it('salta los días de descanso', () => {
    const r = routine([day('push'), day('rest', 'rest'), day('pull')]);
    expect(nextDay(r, [session('push', 1)])?.id).toBe('pull');
    expect(nextDay(r, [session('pull', 1)])?.id).toBe('push');
  });

  it('con un solo día siempre propone ese día', () => {
    const r = routine([day('full')]);
    expect(nextDay(r, [])?.id).toBe('full');
    expect(nextDay(r, [session('full', 1)])?.id).toBe('full');
  });

  it('ignora sesiones en curso y entrenos libres', () => {
    const sessions = [session('push', 1), session('pull', 2, true), session(undefined, 3)];
    expect(nextDay(ppl, sessions)?.id).toBe('pull');
  });

  it('si el día de la última sesión se borró, usa la anterior que siga existiendo', () => {
    expect(nextDay(ppl, [session('push', 1), session('borrado', 2)])?.id).toBe('pull');
  });

  it('si todos los días de las sesiones se borraron, empieza por el primero', () => {
    expect(nextDay(ppl, [session('borrado', 1)])?.id).toBe('push');
  });

  it('devuelve undefined si no hay días de entreno', () => {
    expect(nextDay(routine([]), [])).toBeUndefined();
    expect(nextDay(routine([day('rest', 'rest')]), [session('rest', 1)])).toBeUndefined();
  });
});

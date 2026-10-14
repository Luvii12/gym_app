import { formatRepRange, isRestDay, type RoutineDay } from './routine';

describe('formatRepRange', () => {
  it('muestra el rango con guion', () => {
    expect(formatRepRange(8, 10)).toBe('8-10');
    expect(formatRepRange(6, 8)).toBe('6-8');
  });

  it('muestra un solo número si el rango es de un valor', () => {
    expect(formatRepRange(12, 12)).toBe('12');
  });
});

describe('isRestDay', () => {
  const base: RoutineDay = { id: 'd1', name: 'Push A', kind: 'training', items: [] };

  it('distingue días de entreno y de descanso activo', () => {
    expect(isRestDay(base)).toBe(false);
    expect(isRestDay({ ...base, kind: 'rest' })).toBe(true);
  });
});

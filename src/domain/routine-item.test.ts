import type { RoutineItem } from './routine';
import {
  addExercisesToItems,
  clampInt,
  createRoutineItem,
  formatRest,
  insertItem,
  moveItem,
  removeItem,
  updateItem,
  validateRepRange,
} from './routine-item';

const ids = (items: RoutineItem[]) => items.map((i) => i.exerciseId);
const abc = ['a', 'b', 'c'].map(createRoutineItem);

describe('routine-item', () => {
  it('crea un ejercicio con los valores por defecto', () => {
    expect(createRoutineItem('x')).toEqual({
      exerciseId: 'x',
      sets: 3,
      repsMin: 8,
      repsMax: 10,
      restSec: 90,
    });
  });

  it('clampInt acota, redondea y tolera NaN', () => {
    expect(clampInt(12, 1, 10)).toBe(10);
    expect(clampInt(-3, 1, 10)).toBe(1);
    expect(clampInt(4.6, 1, 10)).toBe(5);
    expect(clampInt(Number.NaN, 1, 10)).toBe(1);
  });

  it('valida el rango de repeticiones', () => {
    expect(validateRepRange(8, 10)).toBeNull();
    expect(validateRepRange(12, 12)).toBeNull();
    expect(validateRepRange(11, 10)).toMatch(/mínimo/);
    expect(validateRepRange(0, 10)).toMatch(/entre 1 y 100/);
    expect(validateRepRange(8, 101)).toMatch(/entre 1 y 100/);
    expect(validateRepRange(8.5, 10)).toMatch(/enteros/);
  });

  it('da formato m:ss al descanso', () => {
    expect(formatRest(90)).toBe('1:30');
    expect(formatRest(45)).toBe('0:45');
    expect(formatRest(0)).toBe('0:00');
    expect(formatRest(600)).toBe('10:00');
  });

  it('añade sin duplicar, ni contra lo existente ni dentro de la entrada', () => {
    expect(ids(addExercisesToItems(abc, ['b', 'd', 'd', 'e']))).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('inserta en su posición y no duplica', () => {
    expect(ids(insertItem(abc, createRoutineItem('z'), 1))).toEqual(['a', 'z', 'b', 'c']);
    expect(ids(insertItem(abc, createRoutineItem('z'), 99))).toEqual(['a', 'b', 'c', 'z']);
    expect(ids(insertItem(abc, createRoutineItem('a'), 1))).toEqual(['a', 'b', 'c']);
  });

  it('quita, mueve y actualiza sin mutar', () => {
    expect(ids(removeItem(abc, 'b'))).toEqual(['a', 'c']);
    expect(ids(moveItem(abc, 0, 2))).toEqual(['b', 'c', 'a']);
    expect(ids(moveItem(abc, 2, 0))).toEqual(['c', 'a', 'b']);
    expect(ids(moveItem(abc, 0, 5))).toEqual(['a', 'b', 'c']);
    expect(updateItem(abc, 'b', { sets: 5 })[1]?.sets).toBe(5);
    expect(abc[1]?.sets).toBe(3);
  });
});

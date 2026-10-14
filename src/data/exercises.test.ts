import { EQUIPMENT, MUSCLE_GROUPS, type MuscleGroup } from '../domain';
import { SEED_EXERCISES } from './exercises';

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

describe('catálogo semilla', () => {
  it('tiene un tamaño razonable', () => {
    expect(SEED_EXERCISES.length).toBeGreaterThanOrEqual(60);
    expect(SEED_EXERCISES.length).toBeLessThanOrEqual(80);
  });

  it('los ids son únicos y están en kebab-case', () => {
    const ids = SEED_EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('los nombres no se repiten, ni siquiera sin tildes ni mayúsculas', () => {
    const names = SEED_EXERCISES.map((e) => normalize(e.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it('todos tienen nombre, músculos y valores válidos del dominio', () => {
    for (const e of SEED_EXERCISES) {
      expect(e.name.trim(), e.id).not.toBe('');
      expect(e.muscles?.trim(), e.id).toBeTruthy();
      expect(MUSCLE_GROUPS, e.id).toContain(e.muscleGroup);
      expect(EQUIPMENT, e.id).toContain(e.equipment);
    }
  });

  it('cubre bien cada grupo muscular que se puede registrar con peso y repeticiones', () => {
    const count = (group: MuscleGroup) =>
      SEED_EXERCISES.filter((e) => e.muscleGroup === group).length;
    for (const group of ['chest', 'back', 'shoulders', 'arms', 'legs'] as const) {
      expect(count(group), group).toBeGreaterThanOrEqual(8);
    }
    expect(count('core')).toBeGreaterThanOrEqual(5);
  });

  it('no incluye cardio: no se puede registrar con peso y repeticiones', () => {
    expect(SEED_EXERCISES.some((e) => e.muscleGroup === 'cardio')).toBe(false);
  });

  it('incluye los ejercicios que aparecen en el prototipo, con su nombre exacto', () => {
    const names = SEED_EXERCISES.map((e) => e.name);
    for (const name of [
      'Press banca plano con barra',
      'Press inclinado con mancuernas',
      'Sentadilla trasera con barra',
      'Press militar de pie',
      'Elevaciones laterales con mancuerna',
      'Remo con barra',
      'Jalón al pecho',
      'Dominadas',
    ]) {
      expect(names, name).toContain(name);
    }
  });
});

import {
  EXERCISE_MUSCLES_MAX,
  EXERCISE_NAME_MAX,
  validateExerciseDraft,
  type ExerciseDraft,
} from './exercise-validation';
import type { Exercise } from './exercise';

const draft = (overrides: Partial<ExerciseDraft> = {}): ExerciseDraft => ({
  name: 'Face pull con cuerda',
  muscleGroup: 'shoulders',
  equipment: 'cable',
  ...overrides,
});

const existing: Exercise[] = [
  {
    id: 'bench',
    name: 'Press banca plano con barra',
    muscleGroup: 'chest',
    equipment: 'barbell',
    isCustom: false,
  },
  { id: 'mine', name: 'Curl Scott', muscleGroup: 'arms', equipment: 'barbell', isCustom: true },
  {
    id: 'old',
    name: 'Remo antiguo',
    muscleGroup: 'back',
    equipment: 'cable',
    isCustom: true,
    archivedAt: 1,
  },
];

describe('validateExerciseDraft', () => {
  it('un ejercicio correcto no tiene errores', () => {
    expect(validateExerciseDraft(draft(), existing)).toEqual({});
  });

  it('el nombre es obligatorio', () => {
    expect(validateExerciseDraft(draft({ name: '   ' }), existing).name).toBe('required');
  });

  it('el nombre tiene un máximo', () => {
    const long = 'a'.repeat(EXERCISE_NAME_MAX + 1);
    expect(validateExerciseDraft(draft({ name: long }), existing).name).toBe('too-long');
    expect(
      validateExerciseDraft(draft({ name: 'a'.repeat(EXERCISE_NAME_MAX) }), existing).name,
    ).toBeUndefined();
  });

  it('no permite repetir un nombre, ni con otras tildes, mayúsculas o espacios', () => {
    expect(
      validateExerciseDraft(draft({ name: 'press BANCA plano con barra ' }), existing).name,
    ).toBe('duplicate');
    expect(validateExerciseDraft(draft({ name: 'Curl scott' }), existing).name).toBe('duplicate');
  });

  it('al editar, el propio ejercicio no cuenta como duplicado', () => {
    expect(validateExerciseDraft(draft({ name: 'Curl Scott' }), existing, 'mine')).toEqual({});
    expect(
      validateExerciseDraft(draft({ name: 'Press banca plano con barra' }), existing, 'mine').name,
    ).toBe('duplicate');
  });

  it('un ejercicio archivado no bloquea reutilizar su nombre', () => {
    expect(validateExerciseDraft(draft({ name: 'Remo antiguo' }), existing)).toEqual({});
  });

  it('los músculos son opcionales pero tienen un máximo', () => {
    expect(validateExerciseDraft(draft({ muscles: '' }), existing)).toEqual({});
    expect(
      validateExerciseDraft(draft({ muscles: 'x'.repeat(EXERCISE_MUSCLES_MAX + 1) }), existing)
        .muscles,
    ).toBe('too-long');
  });

  it('rechaza grupo o equipamiento que no existan', () => {
    const bad = draft({ muscleGroup: 'brain' as never, equipment: 'laser' as never });
    expect(validateExerciseDraft(bad, existing)).toMatchObject({
      muscleGroup: 'invalid',
      equipment: 'invalid',
    });
  });

  it('puede devolver varios errores a la vez', () => {
    const errors = validateExerciseDraft(draft({ name: '', muscleGroup: 'x' as never }), existing);
    expect(Object.keys(errors).sort()).toEqual(['muscleGroup', 'name']);
  });
});

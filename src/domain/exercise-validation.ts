import { EQUIPMENT, MUSCLE_GROUPS, type Exercise } from './exercise';
import { normalizeText } from './exercise-filter';

export const EXERCISE_NAME_MAX = 60;
export const EXERCISE_MUSCLES_MAX = 120;

/** Lo que rellena el usuario al crear o editar un ejercicio. */
export type ExerciseDraft = Pick<Exercise, 'name' | 'muscleGroup' | 'equipment'> & {
  muscles?: string;
};

export type ExerciseErrorCode = 'required' | 'too-long' | 'duplicate' | 'invalid';
export type ExerciseErrors = Partial<
  Record<'name' | 'muscleGroup' | 'equipment' | 'muscles', ExerciseErrorCode>
>;

/**
 * Valida un ejercicio. Devuelve `{}` si es correcto; si no, un código por campo para que la
 * pantalla elija el mensaje. Los archivados no cuentan para detectar nombres repetidos.
 * Al editar, pasa `editingId` para que el propio ejercicio no se cuente como duplicado.
 */
export function validateExerciseDraft(
  draft: ExerciseDraft,
  existing: readonly Exercise[],
  editingId?: string,
): ExerciseErrors {
  const errors: ExerciseErrors = {};

  const name = draft.name.trim();
  if (!name) {
    errors.name = 'required';
  } else if (name.length > EXERCISE_NAME_MAX) {
    errors.name = 'too-long';
  } else {
    const wanted = normalizeText(name);
    const taken = existing.some(
      (e) => e.id !== editingId && !e.archivedAt && normalizeText(e.name) === wanted,
    );
    if (taken) errors.name = 'duplicate';
  }

  if (!MUSCLE_GROUPS.includes(draft.muscleGroup)) errors.muscleGroup = 'invalid';
  if (!EQUIPMENT.includes(draft.equipment)) errors.equipment = 'invalid';
  if ((draft.muscles ?? '').trim().length > EXERCISE_MUSCLES_MAX) errors.muscles = 'too-long';

  return errors;
}

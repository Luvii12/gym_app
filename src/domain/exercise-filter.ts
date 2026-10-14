import {
  EQUIPMENT_LABELS,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  type Exercise,
  type MuscleGroup,
} from './exercise';

export interface ExerciseFilter {
  /** `null` o ausente = todos los grupos. */
  group?: MuscleGroup | null;
  query?: string;
}

/** Minúsculas, sin tildes y sin espacios sobrantes: "Jalón AL Pecho " → "jalon al pecho". */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function searchableText(exercise: Exercise): string {
  return normalizeText(
    [
      exercise.name,
      exercise.muscles ?? '',
      MUSCLE_GROUP_LABELS[exercise.muscleGroup],
      EQUIPMENT_LABELS[exercise.equipment],
    ].join(' '),
  );
}

/** Filtra por grupo y por texto (todas las palabras deben aparecer). Conserva el orden de entrada. */
export function filterExercises(
  exercises: readonly Exercise[],
  { group = null, query = '' }: ExerciseFilter,
): Exercise[] {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  return exercises.filter((exercise) => {
    if (group && exercise.muscleGroup !== group) return false;
    if (words.length === 0) return true;
    const text = searchableText(exercise);
    return words.every((word) => text.includes(word));
  });
}

/** Grupos que tienen al menos un ejercicio, en el orden de `MUSCLE_GROUPS`. */
export function groupsWithExercises(exercises: readonly Exercise[]): MuscleGroup[] {
  const present = new Set(exercises.map((e) => e.muscleGroup));
  return MUSCLE_GROUPS.filter((group) => present.has(group));
}

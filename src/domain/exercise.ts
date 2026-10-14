/** Grupos de los filtros de la pantalla Ejercicios del prototipo (Pecho, Espalda, Piernas…). */
export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'cardio',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  arms: 'Brazos',
  legs: 'Piernas',
  core: 'Core',
  cardio: 'Cardio',
};

export const EQUIPMENT = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'kettlebell',
  'band',
  'other',
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuernas',
  machine: 'Máquina',
  cable: 'Polea',
  bodyweight: 'Peso corporal',
  kettlebell: 'Pesa rusa',
  band: 'Banda',
  other: 'Otro',
};

export interface Exercise {
  /** Slug estable para los de la semilla (`barbell-bench-press`); UUID para los propios. */
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  /** Texto libre con los músculos trabajados: "Pecho mayor, tríceps, deltoides anterior". */
  muscles?: string;
  equipment: Equipment;
  /** Los de la semilla (`false`) no se pueden borrar; los creados por el usuario sí. */
  isCustom: boolean;
}

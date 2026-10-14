import { Pencil } from 'lucide-react';
import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS, type Exercise } from '../../domain';
import { Badge, Card } from '../../components/ui';
import { cn } from '../../lib/cn';

export interface ExerciseCardProps {
  exercise: Exercise;
  /** Solo se ofrece en los ejercicios propios. */
  onEdit?: (exercise: Exercise) => void;
}

export function ExerciseCard({ exercise, onEdit }: ExerciseCardProps) {
  return (
    <li>
      <Card elevation={1} className="relative p-4">
        {exercise.isCustom && onEdit && (
          <button
            type="button"
            aria-label={`Editar ${exercise.name}`}
            onClick={() => onEdit(exercise)}
            className="absolute top-1 right-1 grid size-11 cursor-pointer place-items-center rounded-md text-muted active:text-accent"
          >
            <Pencil aria-hidden size={20} />
          </button>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="group">{MUSCLE_GROUP_LABELS[exercise.muscleGroup]}</Badge>
          {exercise.isCustom ? (
            <Badge variant="accent-outline">Personalizado</Badge>
          ) : (
            <Badge variant="neutral">Predeterminado</Badge>
          )}
        </div>
        <h3
          className={cn('mt-2 text-headline-md text-pretty', exercise.isCustom && onEdit && 'pr-9')}
        >
          {exercise.name}
        </h3>
        {exercise.muscles && <p className="mt-1 text-body-md text-muted">{exercise.muscles}</p>}
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-surface-container-high pt-3">
          <p className="text-body-sm text-muted">{EQUIPMENT_LABELS[exercise.equipment]}</p>
          {/* F5: aquí irán el PR y el "Último" a la derecha de esta fila. */}
        </div>
      </Card>
    </li>
  );
}

import { EQUIPMENT_LABELS, MUSCLE_GROUP_LABELS, type Exercise } from '../../domain';
import { Badge, Card } from '../../components/ui';

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <li>
      <Card elevation={1} className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="group">{MUSCLE_GROUP_LABELS[exercise.muscleGroup]}</Badge>
          {exercise.isCustom ? (
            <Badge variant="accent-outline">Personalizado</Badge>
          ) : (
            <Badge variant="neutral">Predeterminado</Badge>
          )}
        </div>
        <h3 className="mt-2 text-headline-md">{exercise.name}</h3>
        {exercise.muscles && <p className="mt-1 text-body-md text-muted">{exercise.muscles}</p>}
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-surface-container-high pt-3">
          <p className="text-body-sm text-muted">{EQUIPMENT_LABELS[exercise.equipment]}</p>
          {/* F5: aquí irán el PR y el "Último" a la derecha de esta fila. */}
        </div>
      </Card>
    </li>
  );
}

import { CheckCircle2, MoreVertical, Pencil } from 'lucide-react';
import { Link } from 'react-router';
import { Badge, Button, Card } from '../../components/ui';
import { isRestDay, type Routine } from '../../domain';

export interface RoutineCardProps {
  routine: Routine;
  isActive: boolean;
  onActivate: (routine: Routine) => void;
  onMenu: (routine: Routine) => void;
}

export function RoutineCard({ routine, isActive, onActivate, onMenu }: RoutineCardProps) {
  const trainingDays = routine.days.filter((day) => !isRestDay(day)).length;

  return (
    <li>
      <Card elevation={1} accent={isActive} className="relative p-4">
        <button
          type="button"
          aria-label={`Opciones de ${routine.name}`}
          onClick={() => onMenu(routine)}
          className="absolute top-1 right-1 grid size-11 cursor-pointer place-items-center rounded-md text-muted active:text-accent"
        >
          <MoreVertical aria-hidden size={20} />
        </button>
        <div className="flex flex-wrap items-center gap-2 pr-10">
          {isActive && <Badge variant="accent">Rutina activa</Badge>}
          <Badge variant="neutral" className="tabular-nums normal-case">
            {routine.daysPerWeek} días / semana
          </Badge>
        </div>
        <h3 className="mt-2 pr-10 text-headline-md text-pretty">{routine.name}</h3>
        <p className="mt-1 text-body-md text-muted tabular-nums">
          {trainingDays === 1 ? '1 día de entreno' : `${trainingDays} días de entreno`}
        </p>
        {routine.description && (
          <p className="mt-1 text-body-md text-muted">{routine.description}</p>
        )}
        <div className="mt-4 flex gap-3">
          {!isActive && (
            <Button
              variant="outline"
              onClick={() => onActivate(routine)}
              className="flex-1"
              aria-label={`Activar esta rutina: ${routine.name}`}
            >
              <CheckCircle2 aria-hidden size={20} />
              Activar esta rutina
            </Button>
          )}
          <Link
            to={`/rutinas/${routine.id}`}
            aria-label={`Editar ${routine.name}`}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md bg-surface-container-high text-label-lg font-semibold text-on-surface active:scale-[0.98]"
          >
            <Pencil aria-hidden size={18} />
            Editar
          </Link>
        </div>
      </Card>
    </li>
  );
}

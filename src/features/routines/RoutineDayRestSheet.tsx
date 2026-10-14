import { Button, Sheet } from '../../components/ui';
import type { RoutineDay } from '../../domain';

export interface RoutineDayRestSheetProps {
  day: RoutineDay;
  onClose: () => void;
  onConfirm: () => void;
}

export function RoutineDayRestSheet({ day, onClose, onConfirm }: RoutineDayRestSheetProps) {
  return (
    <Sheet open onClose={onClose} title={`¿Pasar «${day.name}» a descanso?`}>
      <p className="text-body-md text-muted">
        Se borrarán los {day.items.length === 1 ? '1 ejercicio' : `${day.items.length} ejercicios`}{' '}
        de este día.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="danger" size="lg" fullWidth onClick={onConfirm}>
          Pasar a descanso
        </Button>
        <Button variant="secondary" size="lg" fullWidth autoFocus onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Sheet>
  );
}

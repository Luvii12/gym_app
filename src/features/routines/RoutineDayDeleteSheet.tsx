import { Button, Sheet } from '../../components/ui';
import type { RoutineDay } from '../../domain';

export interface RoutineDayDeleteSheetProps {
  day: RoutineDay;
  onClose: () => void;
  onConfirm: () => void;
}

export function RoutineDayDeleteSheet({ day, onClose, onConfirm }: RoutineDayDeleteSheetProps) {
  return (
    <Sheet open onClose={onClose} title={`¿Borrar «${day.name}»?`}>
      <p className="text-body-md text-muted">
        {day.items.length > 0
          ? 'Se borrará el día con sus ejercicios.'
          : 'Se quitará este día de la rotación.'}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="danger" size="lg" fullWidth onClick={onConfirm}>
          Borrar día
        </Button>
        <Button variant="secondary" size="lg" fullWidth autoFocus onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Sheet>
  );
}

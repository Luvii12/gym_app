import { Sheet } from '../../components/ui';
import { isRestDay, type LastPerformances, type Routine, type RoutineDay } from '../../domain';
import { PlanChips } from './NextRoutineCard';

export interface DayPickerSheetProps {
  routine: Routine;
  last: LastPerformances;
  onPick: (day: RoutineDay) => void;
  onClose: () => void;
}

/** Elegir otro día de la rutina activa para empezar ahora. */
export function DayPickerSheet({ routine, last, onPick, onClose }: DayPickerSheetProps) {
  const days = routine.days.filter((day) => !isRestDay(day));
  return (
    <Sheet open onClose={onClose} title="Elegir otro día">
      <ul className="flex flex-col gap-2">
        {days.map((day) => (
          <li key={day.id}>
            <button
              type="button"
              onClick={() => onPick(day)}
              className="flex min-h-14 w-full cursor-pointer flex-col gap-2 rounded-md border border-surface-container-high bg-surface-container-lowest p-4 text-left active:border-accent"
            >
              <span className="text-headline-sm">{day.name}</span>
              <PlanChips day={day} last={last} />
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

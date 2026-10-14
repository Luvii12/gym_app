import { ArrowRight, Vibrate, VibrateOff, Volume2, VolumeOff } from 'lucide-react';
import { Button, ProgressBar, Sheet } from '../../components/ui';
import {
  formatRepRange,
  formatRest,
  nextPendingSet,
  setsOf,
  targetOf,
  type WorkoutSession,
} from '../../domain';
import { cn } from '../../lib/cn';
import { formatNumber } from '../../lib/number';
import { useWorkoutPrefs } from './useWorkoutPrefs';

export interface RestSheetProps {
  session: WorkoutSession;
  exerciseId: string;
  setIndex: number;
  exerciseName: string;
  remainingSec: number;
  durationSec: number;
  onAdjust: (deltaSec: number) => void;
  onSkip: () => void;
  onClose: () => void;
}

const adjustButton =
  'min-h-14 cursor-pointer rounded-md border border-surface-container-highest bg-surface-container-lowest ' +
  'text-label-lg tabular-nums active:scale-[0.97]';

function ToggleButton({
  on,
  label,
  onIcon,
  offIcon,
  onClick,
}: {
  on: boolean;
  label: string;
  onIcon: typeof Volume2;
  offIcon: typeof VolumeOff;
  onClick: () => void;
}) {
  const Icon = on ? onIcon : offIcon;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'grid size-11 cursor-pointer place-items-center rounded-md bg-surface-container-high',
        on ? 'text-accent' : 'text-muted',
      )}
    >
      <Icon aria-hidden size={22} />
    </button>
  );
}

/** Hoja completa del descanso (pantalla 3 del prototipo). */
export function RestSheet({
  session,
  exerciseId,
  setIndex,
  exerciseName,
  remainingSec,
  durationSec,
  onAdjust,
  onSkip,
  onClose,
}: RestSheetProps) {
  const prefs = useWorkoutPrefs();
  const done = setsOf(session, exerciseId).find((set) => set.setIndex === setIndex);
  const next = nextPendingSet(session, exerciseId);
  const target = targetOf(session, exerciseId);

  return (
    <Sheet open onClose={onClose} title="Tiempo de descanso">
      <div className="flex items-start justify-between gap-3 border-b border-surface-container-high pb-3">
        <div className="min-w-0">
          <p className="text-label-md text-accent uppercase">Serie {setIndex + 1} completada</p>
          <p className="text-headline-sm text-pretty">
            {exerciseName}
            {done && (
              <span className="tabular-nums">
                {' '}
                ({formatNumber(done.weightKg)} kg × {done.reps} reps)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <ToggleButton
            on={prefs.soundEnabled}
            label={prefs.soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
            onIcon={Volume2}
            offIcon={VolumeOff}
            onClick={() => prefs.setSoundEnabled(!prefs.soundEnabled)}
          />
          <ToggleButton
            on={prefs.vibrationEnabled}
            label={prefs.vibrationEnabled ? 'Desactivar vibración' : 'Activar vibración'}
            onIcon={Vibrate}
            offIcon={VibrateOff}
            onClick={() => prefs.setVibrationEnabled(!prefs.vibrationEnabled)}
          />
        </div>
      </div>

      <p className="mt-5 text-center" role="timer" aria-label="Tiempo de descanso restante">
        <span className="text-display-lg text-accent tabular-nums">{formatRest(remainingSec)}</span>
        <span className="ml-2 text-body-lg text-muted tabular-nums">
          / {formatRest(durationSec)}
        </span>
      </p>
      <ProgressBar
        tone="rest"
        label="Descanso restante"
        value={remainingSec}
        max={durationSec}
        className="mt-3 h-2"
      />

      <div className="mt-5 grid grid-cols-3 gap-2">
        <button type="button" className={adjustButton} onClick={() => onAdjust(-15)}>
          − 15 s
        </button>
        <button type="button" className={adjustButton} onClick={() => onAdjust(15)}>
          + 15 s
        </button>
        <button type="button" className={adjustButton} onClick={() => onAdjust(30)}>
          + 30 s
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-md bg-surface-container-lowest px-4 py-3">
        {next ? (
          <>
            <p className="text-body-md tabular-nums">
              Siguiente: Serie {next.setIndex + 1} · {formatNumber(next.weightKg)} kg
            </p>
            <p className="shrink-0 text-label-sm text-accent uppercase">
              Objetivo: {formatRepRange(target.repsMin, target.repsMax)} reps
            </p>
          </>
        ) : (
          <p className="text-body-md">Ejercicio completado</p>
        )}
      </div>

      <Button size="lg" fullWidth className="mt-4" onClick={onSkip}>
        Saltar descanso
        <ArrowRight aria-hidden size={20} />
      </Button>
    </Sheet>
  );
}

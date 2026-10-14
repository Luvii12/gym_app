import { Flag, Timer } from 'lucide-react';
import { Button, ProgressBar } from '../../components/ui';
import { formatElapsed } from '../../domain';

export interface WorkoutHeaderProps {
  name: string;
  elapsedMs: number;
  done: number;
  total: number;
  onFinish: () => void;
}

export function WorkoutHeader({ name, elapsedMs, done, total, onFinish }: WorkoutHeaderProps) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <header className="sticky top-0 z-10 border-b border-surface-container-high bg-background/92 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
      <div className="mx-auto flex max-w-170 items-center justify-between gap-3 px-4 py-2">
        <div className="min-w-0">
          <p
            role="timer"
            aria-label="Tiempo de entreno"
            className="flex items-center gap-2 text-headline-md text-accent tabular-nums"
          >
            <Timer aria-hidden size={20} />
            {formatElapsed(elapsedMs)}
          </p>
          <h1 className="truncate text-headline-lg">{name}</h1>
        </div>
        <Button variant="secondary" onClick={onFinish} className="text-danger">
          <Flag aria-hidden size={18} />
          Terminar
        </Button>
      </div>
      <div className="mx-auto flex max-w-170 items-center justify-between px-4 pb-1.5 text-label-md">
        <span className="text-muted uppercase">
          Progreso general{' '}
          <span className="text-on-surface tabular-nums">
            {done} / {total} series
          </span>
        </span>
        <span className="text-accent tabular-nums">{percent}%</span>
      </div>
      <ProgressBar label="Progreso general" value={done} max={total} />
    </header>
  );
}

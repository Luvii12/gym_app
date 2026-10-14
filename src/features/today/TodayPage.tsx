import { Flame, Layers, Play, Plus } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button, Card, EmptyState, ProgressBar, Toast } from '../../components/ui';
import {
  isRestDay,
  lastPerformances,
  nextDay,
  weekStreak,
  sessionProgress,
  startSession,
  type RoutineDay,
} from '../../domain';
import {
  RepositoryError,
  sessionRepository,
  useActiveRoutine,
  useActiveSession,
  useAllExercises,
  useFinishedSessions,
} from '../../db';
import { DayPickerSheet } from './DayPickerSheet';
import { LastWorkoutCard } from './LastWorkoutCard';
import { NextRoutineCard } from './NextRoutineCard';

const TOAST_MS = 3000;

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-28 cursor-pointer flex-col items-start gap-2 rounded-lg border border-surface-container-high bg-surface-container-low p-4 text-left active:border-accent"
    >
      <span className="grid size-10 place-items-center rounded-md bg-surface-container-high text-accent">
        {icon}
      </span>
      <span>
        <span className="block text-headline-sm">{title}</span>
        <span className="block text-body-sm text-muted">{subtitle}</span>
      </span>
    </button>
  );
}

export function TodayPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useActiveSession();
  const routine = useActiveRoutine();
  const finished = useFinishedSessions();
  const exercises = useAllExercises();
  const [picking, setPicking] = useState(false);
  const now = useState(() => Date.now())[0];
  const [toast, setToast] = useState<string | null>(
    (location.state as { toast?: string } | null)?.toast ?? null,
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (session === undefined || routine === undefined || !finished || !exercises) return null;

  const last = lastPerformances(finished);
  const day = routine ? nextDay(routine, finished) : undefined;

  async function start(chosen?: RoutineDay) {
    try {
      await sessionRepository.save(
        startSession({
          id: crypto.randomUUID(),
          now: Date.now(),
          last,
          ...(chosen && routine ? { day: chosen, routineId: routine.id } : {}),
        }),
      );
    } catch (error) {
      // Ya había un entreno en curso: se reanuda en vez de crear otro.
      if (!(error instanceof RepositoryError)) {
        setToast('No se pudo empezar el entreno.');
        return;
      }
    }
    navigate('/entreno');
  }

  const date = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  let main: ReactNode;
  if (session) {
    const { done, total } = sessionProgress(session);
    main = (
      <Card elevation={2} className="border-t-2 border-t-accent p-4">
        <span className="text-label-lg text-muted uppercase">Entreno en curso</span>
        <h2 className="mt-2 mb-3 text-headline-lg text-balance">{session.name}</h2>
        <p className="mb-2 text-body-md text-muted tabular-nums">
          {done} / {total} series hechas
        </p>
        <ProgressBar label="Progreso del entreno" value={done} max={total} />
        <Button size="lg" fullWidth className="mt-4" onClick={() => navigate('/entreno')}>
          <Play aria-hidden size={20} />
          Continuar
        </Button>
      </Card>
    );
  } else if (routine && day) {
    main = (
      <NextRoutineCard
        day={day}
        exercises={exercises}
        last={last}
        onStart={() => void start(day)}
      />
    );
  } else if (routine) {
    main = (
      <EmptyState
        icon={Flame}
        title="Sin días de entreno"
        description="Añade días de entreno a tu rutina activa para verlos aquí."
        action={<Button onClick={() => navigate(`/rutinas/${routine.id}`)}>Editar rutina</Button>}
      />
    );
  } else {
    main = (
      <EmptyState
        icon={Flame}
        title="Sin rutina activa"
        description="Crea una rutina para ver aquí tu entreno de hoy."
        action={<Button onClick={() => navigate('/rutinas')}>Crear rutina</Button>}
      />
    );
  }

  const streak = routine ? weekStreak(finished, routine.daysPerWeek, now) : 0;
  const canPick = routine && routine.days.some((d) => !isRestDay(d));

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-body-md text-muted capitalize">{date}</p>
        <h1 className="text-headline-xl">Listo para entrenar</h1>
        <p className="text-body-md text-muted">Mantén la sobrecarga progresiva en cada serie.</p>
      </header>
      {main}
      {streak >= 1 && (
        <p className="flex min-h-11 items-center gap-2 rounded-lg border border-surface-container-high bg-surface-container-low px-4 text-label-lg">
          <Flame aria-hidden size={20} className="shrink-0 text-accent" />
          <span className="tabular-nums">
            Racha de {streak} {streak === 1 ? 'semana' : 'semanas'}
          </span>
        </p>
      )}
      {finished.length > 0 && (
        <LastWorkoutCard finished={finished} exercises={exercises} now={now} />
      )}
      {!session && (
        <div className="grid grid-cols-2 gap-3">
          {canPick && (
            <ActionCard
              icon={<Layers aria-hidden size={22} />}
              title="Elegir otra"
              subtitle="Explorar rutinas"
              onClick={() => setPicking(true)}
            />
          )}
          <ActionCard
            icon={<Plus aria-hidden size={22} />}
            title="Entreno libre"
            subtitle="Sin plantilla fija"
            onClick={() => void start()}
          />
        </div>
      )}
      {picking && routine && (
        <DayPickerSheet
          routine={routine}
          last={last}
          onClose={() => setPicking(false)}
          onPick={(chosen) => {
            setPicking(false);
            void start(chosen);
          }}
        />
      )}
      <Toast message={toast} />
    </div>
  );
}

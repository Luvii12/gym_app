import { useState } from 'react';
import { ChevronRight, History, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';
import { Card, EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';
import { useAllExercises, useFinishedSessions } from '../../db';
import { OneRepMaxCard } from './OneRepMaxCard';
import { WeeklyVolumeCard } from './WeeklyVolumeCard';

export function ProgressPage() {
  const sessions = useFinishedSessions();
  const exercises = useAllExercises();
  const count = sessions?.length ?? 0;
  const now = useState(() => Date.now())[0];

  return (
    <>
      <PageHeader title="Tu Progreso" />
      <Link to="/progreso/historial" className="mb-4 block">
        <Card className="flex items-center gap-3 p-4 active:bg-surface-container">
          <History aria-hidden size={24} className="shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <h2 className="text-headline-sm">Historial</h2>
            <p className="text-body-md text-muted tabular-nums">
              {count === 1 ? '1 entreno' : `${count} entrenos`}
            </p>
          </div>
          <ChevronRight aria-hidden size={20} className="shrink-0 text-muted" />
        </Card>
      </Link>
      {sessions && exercises && count > 0 && (
        <>
          <OneRepMaxCard sessions={sessions} exercises={exercises} now={now} />
          <WeeklyVolumeCard sessions={sessions} now={now} />
        </>
      )}
      {count === 0 && (
        <EmptyState
          icon={TrendingUp}
          title="Todavía no hay datos"
          description="Registra tu primer entreno y verás aquí tu evolución."
        />
      )}
    </>
  );
}

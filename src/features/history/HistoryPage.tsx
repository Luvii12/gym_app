import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { Link } from 'react-router';
import { Card, EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';
import { useFinishedSessions } from '../../db';
import { completedSets, sessionDuration, sessionVolume } from '../../domain';
import { formatNumber } from '../../lib/number';
import { formatMinutes, formatSessionDate } from './format';

export function HistoryPage() {
  const sessions = useFinishedSessions();

  return (
    <>
      <Link
        to="/progreso"
        className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-1 px-2 text-label-lg text-muted active:text-accent"
      >
        <ChevronLeft aria-hidden size={20} />
        Progreso
      </Link>
      <PageHeader title="Historial" description="Tus entrenos terminados." />
      {sessions && sessions.length === 0 && (
        <EmptyState
          icon={History}
          title="Aún no hay entrenos"
          description="Cuando termines un entreno aparecerá aquí."
        />
      )}
      {sessions && sessions.length > 0 && (
        <ul className="flex flex-col gap-3">
          {sessions.map((session) => {
            const duration = sessionDuration(session);
            return (
              <li key={session.id}>
                <Link to={`/progreso/historial/${session.id}`} className="block">
                  <Card className="flex items-center gap-3 p-4 active:bg-surface-container">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-headline-sm text-pretty">{session.name}</h2>
                      <p className="mt-0.5 text-body-md text-muted capitalize">
                        {formatSessionDate(session.startedAt)}
                      </p>
                      <p className="mt-1 text-body-md text-muted tabular-nums">
                        {duration !== undefined && `${formatMinutes(duration)} · `}
                        {completedSets(session).length} series ·{' '}
                        {formatNumber(sessionVolume(session))} kg
                      </p>
                    </div>
                    <ChevronRight aria-hidden size={20} className="shrink-0 text-muted" />
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

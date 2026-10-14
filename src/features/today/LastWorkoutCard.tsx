import { ChevronRight, Trophy } from 'lucide-react';
import { Link } from 'react-router';
import { Card } from '../../components/ui';
import {
  daysSince,
  sessionDuration,
  sessionRecords,
  sessionVolume,
  type Exercise,
  type WorkoutSession,
} from '../../domain';
import { formatNumber } from '../../lib/number';
import { formatDaysAgo } from '../../lib/relative-time';
import { formatMinutes } from '../history/format';

export function LastWorkoutCard({
  finished,
  exercises,
  now,
}: {
  /** Sesiones terminadas, la más reciente primero. */
  finished: readonly WorkoutSession[];
  exercises: readonly Exercise[];
  now: number;
}) {
  const last = finished[0];
  if (!last) return null;

  const duration = sessionDuration(last);
  const record = sessionRecords(finished, last)[0];
  const recordName = record && exercises.find((e) => e.id === record.exerciseId)?.name;

  return (
    <Link to={`/progreso/historial/${last.id}`} className="block">
      <Card className="p-4 active:bg-surface-container">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-label-lg text-muted uppercase">Último entreno</span>
            <h2 className="text-headline-sm text-pretty">{last.name}</h2>
            <p className="text-body-md text-muted tabular-nums">
              <span className="capitalize">{formatDaysAgo(daysSince(last.startedAt, now))}</span>
              {duration !== undefined && ` · ${formatMinutes(duration)}`}
              {` · ${formatNumber(Math.round(sessionVolume(last)))} kg`}
            </p>
            {record && recordName && (
              <p className="mt-2 flex items-center gap-1.5 text-body-md text-accent tabular-nums">
                <Trophy aria-hidden size={16} className="shrink-0" />
                <span>
                  PR · {recordName} +{formatNumber(record.improvement)} kg
                </span>
              </p>
            )}
          </div>
          <ChevronRight aria-hidden size={20} className="mt-1 shrink-0 text-muted" />
        </div>
      </Card>
    </Link>
  );
}

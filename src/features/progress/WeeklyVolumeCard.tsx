import { useMemo } from 'react';
import { Card } from '../../components/ui';
import { weeklyVolume, type WorkoutSession } from '../../domain';
import { cn } from '../../lib/cn';
import { formatNumber } from '../../lib/number';

const WEEKS = 8;

const shortDate = (at: number) =>
  new Date(at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace(/\./g, '');

export function WeeklyVolumeCard({
  sessions,
  now,
}: {
  sessions: readonly WorkoutSession[];
  now: number;
}) {
  const weeks = useMemo(() => weeklyVolume(sessions, now).slice(-WEEKS), [sessions, now]);
  if (weeks.length === 0) return null;

  const current = weeks[weeks.length - 1]!;
  const max = Math.max(...weeks.map((w) => w.volume));
  const bestIndex = max > 0 ? weeks.findIndex((w) => w.volume === max) : -1;
  const summary =
    `Volumen semanal de las últimas ${weeks.length} semanas. ` +
    (bestIndex >= 0
      ? `Mejor semana: la del ${shortDate(weeks[bestIndex]!.weekStart)}, ${formatNumber(Math.round(max))} kg.`
      : 'Sin volumen registrado.');

  return (
    <Card className="mb-4 p-4">
      <h2 className="text-headline-sm">Volumen semanal total</h2>
      <p className="mt-3 text-display-lg-mobile tabular-nums">
        {formatNumber(Math.round(current.volume))}
        <span className="ml-1 text-headline-sm text-muted">kg</span>
      </p>
      <p className="mb-4 text-body-md text-muted">Esta semana</p>
      <div role="img" aria-label={summary} className="flex h-40 items-end gap-2">
        {weeks.map((week, i) => {
          const isBest = i === bestIndex;
          const height = max > 0 ? Math.max((week.volume / max) * 100, week.volume > 0 ? 4 : 0) : 0;
          return (
            <div key={week.weekStart} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              <span className="mb-1 h-3 text-center text-label-sm text-accent">
                {isBest ? 'MÁX' : ''}
              </span>
              <div
                className={cn(
                  'w-full rounded-t-sm',
                  isBest ? 'bg-accent' : 'bg-surface-container-highest',
                )}
                style={{ height: `${height * 0.7}%` }}
              />
              <span className="mt-1 truncate text-center text-label-sm text-muted tabular-nums">
                {shortDate(week.weekStart)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

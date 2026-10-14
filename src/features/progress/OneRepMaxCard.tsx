import { lazy, Suspense, useMemo, useState } from 'react';
import { Badge, Card, SelectField } from '../../components/ui';
import { exerciseHistory, oneRepMaxChange, type Exercise, type WorkoutSession } from '../../domain';
import { formatNumber } from '../../lib/number';

const OneRepMaxChart = lazy(() => import('./OneRepMaxChart'));

const shortDate = (at: number) =>
  new Date(at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace(/\./g, '');

const roundHalf = (kg: number) => Math.round(kg * 2) / 2;

interface Props {
  sessions: readonly WorkoutSession[];
  exercises: readonly Exercise[];
  now: number;
}

export function OneRepMaxCard({ sessions, exercises, now }: Props) {
  const [chosen, setChosen] = useState<string>();

  /** Ejercicios con historial, el entrenado más recientemente primero. */
  const options = useMemo(() => {
    const ids = new Set<string>();
    for (const s of sessions) for (const set of s.sets) ids.add(set.exerciseId);
    return [...ids]
      .map((id) => ({ id, points: exerciseHistory(sessions, id) }))
      .filter((e) => e.points.length > 0)
      .sort((a, b) => b.points[b.points.length - 1]!.at - a.points[a.points.length - 1]!.at)
      .map((e) => ({
        value: e.id,
        label: exercises.find((x) => x.id === e.id)?.name ?? 'Ejercicio eliminado',
      }));
  }, [sessions, exercises]);

  const exerciseId = options.some((o) => o.value === chosen) ? chosen : options[0]?.value;
  const points = useMemo(
    () => (exerciseId ? exerciseHistory(sessions, exerciseId) : []),
    [sessions, exerciseId],
  );
  if (!exerciseId || points.length === 0) return null;

  const best = points.reduce((a, b) => (b.oneRepMax > a.oneRepMax ? b : a));
  const change = oneRepMaxChange(points, now);
  const peak = new Date(best.at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  const chartPoints = points.map((p) => ({ label: shortDate(p.at), value: p.oneRepMax }));
  const summary = `Gráfica del 1RM estimado en ${points.length} ${
    points.length === 1 ? 'sesión' : 'sesiones'
  }, de ${formatNumber(roundHalf(points[0]!.oneRepMax))} kg el ${shortDate(points[0]!.at)} a ${formatNumber(
    roundHalf(points[points.length - 1]!.oneRepMax),
  )} kg el ${shortDate(points[points.length - 1]!.at)}.`;

  return (
    <Card className="mb-4 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-headline-sm">Histórico de cargas (1RM)</h2>
        {change && (
          <Badge variant="accent-outline" className="shrink-0 tabular-nums">
            {change.percent >= 0 ? '+' : ''}
            {formatNumber(Math.round(change.percent * 10) / 10)} % (3 meses)
          </Badge>
        )}
      </div>
      <SelectField
        label="Ejercicio"
        value={exerciseId}
        onChange={setChosen}
        options={options}
        className="mb-4"
      />
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-label-md text-muted uppercase">Récord actual estimado</p>
          <p className="text-display-lg-mobile text-accent tabular-nums">
            {formatNumber(roundHalf(best.oneRepMax))}
            <span className="ml-1 text-headline-sm text-muted">kg</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-label-md text-muted uppercase">Pico registrado</p>
          <p className="text-headline-sm tabular-nums">{peak}</p>
        </div>
      </div>
      <div role="img" aria-label={summary} className="h-44 w-full">
        <Suspense fallback={null}>
          <OneRepMaxChart points={chartPoints} />
        </Suspense>
      </div>
    </Card>
  );
}

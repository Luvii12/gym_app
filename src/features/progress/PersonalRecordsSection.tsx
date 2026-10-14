import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Badge, Card } from '../../components/ui';
import {
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  daysSince,
  personalRecords,
  type Exercise,
  type PersonalRecord,
  type WorkoutSession,
} from '../../domain';
import { formatNumber } from '../../lib/number';
import { formatDaysAgo } from '../../lib/relative-time';

export function PersonalRecordsSection({
  sessions,
  exercises,
  now,
}: {
  sessions: readonly WorkoutSession[];
  exercises: readonly Exercise[];
  now: number;
}) {
  const items = useMemo(() => {
    const byId = new Map(exercises.map((e) => [e.id, e]));
    return personalRecords(sessions)
      .flatMap((record) => {
        const exercise = byId.get(record.exerciseId);
        return exercise ? [{ record, exercise }] : [];
      })
      .sort(
        (a, b) =>
          MUSCLE_GROUPS.indexOf(a.exercise.muscleGroup) -
            MUSCLE_GROUPS.indexOf(b.exercise.muscleGroup) ||
          b.record.oneRepMax - a.record.oneRepMax,
      );
  }, [sessions, exercises]);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="records-title" className="mb-4">
      <h2 id="records-title" className="mb-3 text-headline-sm">
        Récords personales (PR)
      </h2>
      <ul className="grid grid-cols-2 gap-3">
        {items.map(({ record, exercise }) => (
          <li key={record.exerciseId}>
            <RecordCard record={record} exercise={exercise} now={now} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecordCard({
  record,
  exercise,
  now,
}: {
  record: PersonalRecord;
  exercise: Exercise;
  now: number;
}) {
  return (
    <Card className="flex h-full flex-col gap-1 p-3">
      <div className="flex min-h-6 items-center justify-between gap-1">
        <span className="truncate text-label-sm text-muted uppercase">
          {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
        </span>
        {record.improvement !== undefined && record.improvement > 0 && (
          <Badge variant="accent-outline" className="shrink-0 tabular-nums normal-case">
            +{formatNumber(record.improvement)} kg
          </Badge>
        )}
      </div>
      <h3 className="text-body-md font-semibold text-pretty">{exercise.name}</h3>
      <p className="mt-auto text-headline-lg tabular-nums">
        {formatNumber(record.oneRepMax)}
        <span className="ml-1 text-body-md text-muted">kg</span>
      </p>
      <p className="text-body-sm text-muted tabular-nums">
        {formatNumber(record.weightKg)} kg × {record.reps}
      </p>
      <p className="flex items-center gap-1 text-body-sm text-muted">
        <Clock aria-hidden size={14} className="shrink-0" />
        <span className="capitalize">{formatDaysAgo(daysSince(record.achievedAt, now))}</span>
      </p>
    </Card>
  );
}

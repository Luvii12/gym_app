import { Layers, ListOrdered, Play, Timer, Zap } from 'lucide-react';
import { Badge, Button, Card } from '../../components/ui';
import { planDay, type Exercise, type LastPerformances, type RoutineDay } from '../../domain';
import { formatNumber } from '../../lib/number';

export interface NextRoutineCardProps {
  day: RoutineDay;
  exercises: readonly Exercise[];
  last: LastPerformances;
  onStart: () => void;
}

export function PlanChips({ day, last }: { day: RoutineDay; last: LastPerformances }) {
  const plan = planDay(day, last);
  const chip =
    'inline-flex min-h-8 items-center gap-1.5 rounded-md border border-surface-container-high bg-surface-container-lowest px-3 text-body-md tabular-nums';
  return (
    <ul className="flex flex-wrap gap-2">
      <li className={chip}>
        <Timer aria-hidden size={16} className="text-accent" />~{plan.estimatedMinutes} min
      </li>
      <li className={chip}>
        <ListOrdered aria-hidden size={16} className="text-accent" />
        {plan.exercises} {plan.exercises === 1 ? 'ejercicio' : 'ejercicios'}
      </li>
      <li className={chip}>
        <Layers aria-hidden size={16} className="text-accent" />
        {plan.sets} {plan.sets === 1 ? 'serie' : 'series'}
      </li>
    </ul>
  );
}

export function NextRoutineCard({ day, exercises, last, onStart }: NextRoutineCardProps) {
  const plan = planDay(day, last);
  return (
    <Card elevation={2} className="border-t-2 border-t-accent p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-label-lg text-muted uppercase">Siguiente rutina</span>
          <Badge variant="accent">Activa</Badge>
        </div>
        <Zap aria-hidden size={20} className="text-decor" />
      </div>
      <h2 className="mt-2 mb-3 text-headline-lg text-balance">{day.name}</h2>
      <PlanChips day={day} last={last} />

      <ol className="my-4 flex flex-col gap-3 rounded-md border border-surface-container-high bg-surface-container-lowest p-4">
        {plan.items.map((item, index) => (
          <li key={item.exerciseId} className="flex items-baseline gap-3">
            <span className="w-4 text-body-md text-muted tabular-nums">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-body-lg">
              {exercises.find((e) => e.id === item.exerciseId)?.name ?? 'Ejercicio eliminado'}
            </span>
            <span className="shrink-0 text-body-sm text-muted tabular-nums">
              {item.sets} {item.sets === 1 ? 'serie' : 'series'}
              {item.weightKg !== undefined && ` · ${formatNumber(item.weightKg)} kg`}
            </span>
          </li>
        ))}
      </ol>

      <Button size="lg" fullWidth onClick={onStart}>
        <Play aria-hidden size={20} />
        Empezar entreno
      </Button>
    </Card>
  );
}

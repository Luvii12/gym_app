import { useRef, useState } from 'react';
import { RepositoryError, routineRepository } from '../../db';
import type { Routine } from '../../domain';

export type RoutineChanges = Partial<Pick<Routine, 'name' | 'daysPerWeek' | 'days'>>;

/**
 * Guardado al momento con cola: cada cambio se calcula sobre la rutina recién leída,
 * aunque se pulse deprisa, para no pisar datos.
 */
export function useRoutineSaver(routineId: string) {
  const [failure, setFailure] = useState<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());

  function save(compute: (current: Routine) => RoutineChanges): Promise<boolean> {
    const run = queue.current.then(async () => {
      try {
        const current = await routineRepository.get(routineId);
        if (!current) throw new RepositoryError('not-found', 'La rutina ya no existe.');
        await routineRepository.update(routineId, compute(current));
        setFailure(null);
        return true;
      } catch (error) {
        setFailure(
          error instanceof RepositoryError
            ? error.message
            : 'No se pudo guardar el cambio. Inténtalo de nuevo.',
        );
        return false;
      }
    });
    queue.current = run.then(() => undefined);
    return run;
  }

  return { save, failure };
}

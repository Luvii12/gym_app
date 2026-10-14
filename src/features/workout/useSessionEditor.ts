import { useCallback, useEffect, useRef } from 'react';
import type { WorkoutSession } from '../../domain';
import { sessionRepository } from '../../db';

/**
 * Aplica cambios de dominio a la sesión y los guarda al momento. Encadena los guardados y parte
 * de la última versión local para que dos toques seguidos no se pisen antes de que la db responda.
 */
export function useSessionEditor(session: WorkoutSession) {
  const latest = useRef(session);
  const pending = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    if (pending.current === 0) latest.current = session;
  }, [session]);

  const edit = useCallback((change: (current: WorkoutSession) => WorkoutSession) => {
    const next = change(latest.current);
    if (next === latest.current) return next;
    latest.current = next;
    pending.current += 1;
    queue.current = queue.current
      .then(() => sessionRepository.save(next))
      .catch(() => undefined)
      .finally(() => {
        pending.current -= 1;
      });
    return next;
  }, []);

  /** Espera a que acaben los guardados pendientes (antes de terminar o descartar). */
  const flush = useCallback(async () => {
    await queue.current;
  }, []);

  return { edit, flush };
}

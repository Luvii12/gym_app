import { useEffect } from 'react';

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}
interface WakeLockApi {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>;
}

/** Mantiene la pantalla encendida mientras `active`; se vuelve a pedir al volver a la app. Sin soporte, no hace nada. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const api = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;
    if (!api) return;
    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    async function acquire() {
      try {
        const lock = await api!.request('screen');
        if (cancelled) void lock.release().catch(() => undefined);
        else sentinel = lock;
      } catch {
        // denegado (batería baja, pestaña oculta…): se ignora
      }
    }
    function handleVisibility() {
      if (document.visibilityState === 'visible') void acquire();
    }

    void acquire();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}

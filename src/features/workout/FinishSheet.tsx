import { useState } from 'react';
import { Button, Sheet } from '../../components/ui';

export interface FinishSheetProps {
  done: number;
  total: number;
  onFinish: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

/** Confirmación de "Terminar": resumen y opciones terminar / descartar / seguir. */
export function FinishSheet({ done, total, onFinish, onDiscard, onClose }: FinishSheetProps) {
  const [discarding, setDiscarding] = useState(false);

  if (discarding) {
    return (
      <Sheet open onClose={onClose} title="¿Descartar entreno?">
        <p className="mb-4 text-body-md text-muted">
          Se borrará este entreno y no quedará en tu historial. No se puede deshacer.
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="danger" fullWidth onClick={onDiscard}>
            Descartar entreno
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setDiscarding(false)}>
            Cancelar
          </Button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={onClose} title="¿Terminar el entreno?">
      <p className="mb-1 text-headline-md tabular-nums">
        {done} / {total} series hechas
      </p>
      <p className="mb-4 text-body-md text-muted">
        {done === 0
          ? 'Aún no has marcado ninguna serie, así que no hay nada que guardar.'
          : 'Las series sin marcar no se guardarán.'}
      </p>
      <div className="flex flex-col gap-2">
        {done > 0 && (
          <Button size="lg" fullWidth onClick={onFinish}>
            Terminar entreno
          </Button>
        )}
        <Button variant="secondary" fullWidth onClick={onClose}>
          Seguir
        </Button>
        <Button
          variant="ghost"
          fullWidth
          className="text-danger"
          onClick={() => setDiscarding(true)}
        >
          Descartar entreno
        </Button>
      </div>
    </Sheet>
  );
}

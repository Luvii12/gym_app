import { Hourglass } from 'lucide-react';
import { Button } from '../../components/ui';
import { formatRest } from '../../domain';

export interface RestBannerProps {
  remainingSec: number;
  onOpen: () => void;
  onAdd: () => void;
  onSkip: () => void;
}

/** Banner inferior fijo mientras corre el descanso; tocar el texto abre la hoja completa. */
export function RestBanner({ remainingSec, onOpen, onAdd, onSkip }: RestBannerProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-container-highest bg-surface-container-low/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
      <div className="mx-auto flex max-w-170 items-center gap-2 px-4 py-3">
        <button
          type="button"
          aria-label="Abrir temporizador de descanso"
          onClick={onOpen}
          className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-md border border-rest/40 bg-rest/10 text-rest">
            <Hourglass aria-hidden size={22} />
          </span>
          <span className="min-w-0">
            <span className="block text-label-md text-muted uppercase">
              Descanso:{' '}
              <span className="text-headline-sm text-rest tabular-nums">
                {formatRest(remainingSec)}
              </span>
            </span>
            <span className="block truncate text-body-sm text-muted">Toca para ampliar</span>
          </span>
        </button>
        <Button variant="secondary" onClick={onAdd} aria-label="Añadir 30 segundos">
          +30s
        </Button>
        <Button variant="secondary" onClick={onSkip}>
          Saltar
        </Button>
      </div>
    </div>
  );
}

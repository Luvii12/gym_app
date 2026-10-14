import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
}

/** Hoja inferior modal (nivel 3 de DESIGN.md). Se pinta en `document.body`. */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Siempre la última versión, sin reabrir efectos cuando el padre re-renderiza.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // El elemento que abrió la hoja se anota durante el render: un campo con autoFocus ya habría
  // robado el foco cuando corra cualquier efecto.
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open)
      setOpener(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Si un campo ya se enfocó solo (autoFocus), se respeta; si no, el primero del contenido.
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) {
      const first = bodyRef.current ? focusableIn(bodyRef.current)[0] : undefined;
      (first ?? closeRef.current)?.focus();
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
      }
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, [open, opener]);

  if (!open) return null;

  function trapTab(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab' || !panelRef.current) return;
    const items = focusableIn(panelRef.current);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !panelRef.current.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        aria-hidden
        data-testid="sheet-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-surface-container-lowest/80"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapTab}
        className="relative flex max-h-[90dvh] w-full max-w-170 flex-col rounded-t-xl border border-b-0 border-accent/15 bg-surface-container-low shadow-overlay"
      >
        <div className="flex items-start justify-between gap-3 py-2 pr-2 pl-4">
          <h2 id={titleId} className="min-w-0 pt-2 text-headline-md text-balance">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-muted active:text-on-surface"
          >
            <X aria-hidden size={24} />
          </button>
        </div>
        <div
          ref={bodyRef}
          className="overflow-y-auto overscroll-contain px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

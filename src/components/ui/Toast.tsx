export interface ToastProps {
  message: string | null;
}

/** aviso breve sobre la barra de navegación y el botón flotante. El contenedor existe siempre para que lo anuncie el lector de pantalla. */
export function Toast({ message }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(4.25rem+env(safe-area-inset-bottom)+5rem)] z-40 mx-auto flex max-w-170 justify-center"
    >
      {message && (
        <p className="rounded-md bg-inverse-surface px-4 py-3 text-center text-label-lg text-inverse-on-surface shadow-overlay">
          {message}
        </p>
      )}
    </div>
  );
}

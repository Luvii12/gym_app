import { Button, Sheet } from '../../components/ui';

export interface DeleteSessionSheetProps {
  /** La sesión se ha quedado sin series. */
  empty?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteSessionSheet({ empty = false, onConfirm, onClose }: DeleteSessionSheetProps) {
  return (
    <Sheet open onClose={onClose} title="¿Borrar entreno?">
      <p className="mb-4 text-body-md text-muted">
        {empty
          ? 'Este entreno se ha quedado sin series. '
          : 'Se borrará este entreno de tu historial. '}
        No se puede deshacer.
      </p>
      <div className="flex flex-col gap-2">
        <Button variant="danger" fullWidth onClick={onConfirm}>
          Borrar entreno
        </Button>
        <Button variant="secondary" fullWidth onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Sheet>
  );
}

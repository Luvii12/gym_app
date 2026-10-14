import { Copy, Pencil, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button, Sheet } from '../../components/ui';
import { routineRepository } from '../../db';
import type { Routine } from '../../domain';

export interface RoutineMenuSheetProps {
  routine: Routine;
  onClose: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function MenuItem({
  icon,
  danger,
  onClick,
  children,
}: {
  icon: ReactNode;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-label-lg active:bg-surface-container-high ${danger ? 'text-danger' : 'text-on-surface'}`}
    >
      {icon}
      {children}
    </button>
  );
}

/** Menú ⋮ de una rutina, como hoja inferior. */
export function RoutineMenuSheet({
  routine,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
}: RoutineMenuSheetProps) {
  return (
    <Sheet open onClose={onClose} title={routine.name}>
      <div className="flex flex-col gap-1">
        <MenuItem icon={<Pencil aria-hidden size={20} />} onClick={onRename}>
          Renombrar
        </MenuItem>
        <MenuItem icon={<Copy aria-hidden size={20} />} onClick={onDuplicate}>
          Duplicar
        </MenuItem>
        <MenuItem icon={<Trash2 aria-hidden size={20} />} danger onClick={onDelete}>
          Borrar
        </MenuItem>
      </div>
    </Sheet>
  );
}

export interface RoutineDeleteSheetProps {
  routine: Routine;
  isActive: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
}

export function RoutineDeleteSheet({
  routine,
  isActive,
  onClose,
  onDone,
}: RoutineDeleteSheetProps) {
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function handleDelete() {
    if (saving) return;
    setSaving(true);
    setFailure(null);
    try {
      await routineRepository.remove(routine.id);
      onDone('Rutina borrada');
    } catch {
      setFailure('No se pudo borrar. Inténtalo de nuevo.');
      setSaving(false);
    }
  }

  return (
    <Sheet open onClose={onClose} title={`¿Borrar «${routine.name}»?`}>
      <p className="text-body-md text-muted">
        Se borrarán la rutina y sus días. Tus entrenos ya registrados se conservan.
      </p>
      {isActive && (
        <p className="mt-3 text-body-md text-on-surface">
          Es tu rutina activa: pasará a serlo la más antigua de las que queden.
        </p>
      )}
      {failure && (
        <p role="alert" className="mt-4 text-body-md text-danger">
          {failure}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="danger" size="lg" fullWidth disabled={saving} onClick={handleDelete}>
          Borrar
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          autoFocus
          disabled={saving}
          onClick={onClose}
        >
          Cancelar
        </Button>
      </div>
    </Sheet>
  );
}

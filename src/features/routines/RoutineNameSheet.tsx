import { useState, type FormEvent } from 'react';
import { Button, Sheet, TextField } from '../../components/ui';
import { routineRepository } from '../../db';
import type { Routine } from '../../domain';

export const ROUTINE_NAME_MAX = 60;

export interface RoutineNameSheetProps {
  /** Rutina a renombrar; sin ella se crea una nueva. */
  routine?: Routine;
  onClose: () => void;
  onDone: (message: string) => void;
}

export function RoutineNameSheet({ routine, onClose, onDone }: RoutineNameSheetProps) {
  const [name, setName] = useState(routine?.name ?? '');
  const [attempted, setAttempted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const nameError = attempted && name.trim() === '' ? 'Escribe un nombre.' : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setAttempted(true);
    setFailure(null);
    if (name.trim() === '') return;

    setSaving(true);
    try {
      if (routine) await routineRepository.update(routine.id, { name });
      else await routineRepository.create({ name });
      onDone(routine ? 'Rutina renombrada' : 'Rutina creada');
    } catch {
      setFailure('No se pudo guardar. Inténtalo de nuevo.');
      setSaving(false);
    }
  }

  return (
    <Sheet open onClose={onClose} title={routine ? 'Renombrar rutina' : 'Nueva rutina'}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Nombre"
          value={name}
          onChange={setName}
          maxLength={ROUTINE_NAME_MAX}
          autoFocus
          autoComplete="off"
          placeholder="Ej.: Push / Pull / Legs"
          error={nameError}
        />
        {failure && (
          <p role="alert" className="text-body-md text-danger">
            {failure}
          </p>
        )}
        <Button type="submit" size="lg" fullWidth disabled={saving} className="mt-2">
          {routine ? 'Guardar cambios' : 'Crear rutina'}
        </Button>
      </form>
    </Sheet>
  );
}

import { useState, type FormEvent } from 'react';
import { Button, SelectField, Sheet, TextField } from '../../components/ui';
import { RepositoryError, exerciseRepository } from '../../db';
import {
  EQUIPMENT,
  EQUIPMENT_LABELS,
  EXERCISE_MUSCLES_MAX,
  EXERCISE_NAME_MAX,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  validateExerciseDraft,
  type Equipment,
  type Exercise,
  type ExerciseErrorCode,
  type MuscleGroup,
} from '../../domain';

export type ExerciseSheetMode = 'create' | { edit: Exercise };

export interface ExerciseSheetProps {
  mode: ExerciseSheetMode;
  /** Ejercicios visibles del catálogo, para detectar nombres repetidos. */
  exercises: readonly Exercise[];
  onClose: () => void;
  onDone: (message: string) => void;
}

const GROUP_OPTIONS = MUSCLE_GROUPS.map((value) => ({
  value,
  label: MUSCLE_GROUP_LABELS[value],
}));
const EQUIPMENT_OPTIONS = EQUIPMENT.map((value) => ({ value, label: EQUIPMENT_LABELS[value] }));

const SAVE_ERROR = 'No se pudo guardar. Inténtalo de nuevo.';
const DELETE_ERROR = 'No se pudo borrar. Inténtalo de nuevo.';

function nameMessage(code: ExerciseErrorCode | undefined): string | undefined {
  switch (code) {
    case 'required':
      return 'Escribe un nombre.';
    case 'too-long':
      return `Máximo ${EXERCISE_NAME_MAX} caracteres.`;
    case 'duplicate':
      return 'Ya existe un ejercicio con ese nombre.';
    default:
      return undefined;
  }
}

function musclesMessage(code: ExerciseErrorCode | undefined): string | undefined {
  return code === 'too-long' ? `Máximo ${EXERCISE_MUSCLES_MAX} caracteres.` : undefined;
}

function asGroup(value: string): MuscleGroup {
  return MUSCLE_GROUPS.find((group) => group === value) ?? MUSCLE_GROUPS[0];
}

function asEquipment(value: string): Equipment {
  return EQUIPMENT.find((item) => item === value) ?? 'barbell';
}

export function ExerciseSheet({ mode, exercises, onClose, onDone }: ExerciseSheetProps) {
  const editing = mode === 'create' ? null : mode.edit;

  const [name, setName] = useState(editing?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(
    editing?.muscleGroup ?? MUSCLE_GROUPS[0],
  );
  const [equipment, setEquipment] = useState<Equipment>(editing?.equipment ?? 'barbell');
  const [muscles, setMuscles] = useState(editing?.muscles ?? '');
  const [attempted, setAttempted] = useState(false);
  const [duplicateFromDb, setDuplicateFromDb] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const errors = validateExerciseDraft(
    { name, muscleGroup, equipment, muscles },
    exercises,
    editing?.id,
  );
  const nameError =
    (attempted ? nameMessage(errors.name) : undefined) ??
    (duplicateFromDb ? nameMessage('duplicate') : undefined);
  const musclesError = attempted ? musclesMessage(errors.muscles) : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setAttempted(true);
    setFailure(null);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const input = { name, muscleGroup, equipment, muscles };
      if (editing) await exerciseRepository.update(editing.id, input);
      else await exerciseRepository.create(input);
      onDone(editing ? 'Cambios guardados' : 'Ejercicio creado');
    } catch (error) {
      if (error instanceof RepositoryError && error.code === 'duplicate') {
        setDuplicateFromDb(true);
        setAttempted(true);
      } else {
        setFailure(SAVE_ERROR);
      }
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing || saving) return;
    setSaving(true);
    setFailure(null);
    try {
      const result = await exerciseRepository.remove(editing.id);
      onDone(
        result === 'deleted'
          ? 'Ejercicio borrado'
          : 'Ejercicio quitado del catálogo. Se conserva en tu historial.',
      );
    } catch {
      setFailure(DELETE_ERROR);
      setSaving(false);
    }
  }

  if (editing && confirming) {
    return (
      <Sheet open onClose={onClose} title={`¿Borrar «${editing.name}»?`}>
        <p className="text-body-md text-muted">
          Se quitará del catálogo. Si ya lo usaste en una rutina o en un entreno, se conserva en tu
          historial.
        </p>
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
            onClick={() => {
              setFailure(null);
              setConfirming(false);
            }}
          >
            Cancelar
          </Button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={onClose} title={editing ? 'Editar ejercicio' : 'Nuevo ejercicio'}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Nombre"
          value={name}
          onChange={(value) => {
            setName(value);
            setDuplicateFromDb(false);
          }}
          maxLength={EXERCISE_NAME_MAX}
          autoFocus
          autoComplete="off"
          enterKeyHint="next"
          error={nameError}
        />
        <SelectField
          label="Grupo muscular"
          value={muscleGroup}
          onChange={(value) => setMuscleGroup(asGroup(value))}
          options={GROUP_OPTIONS}
        />
        <SelectField
          label="Equipamiento"
          value={equipment}
          onChange={(value) => setEquipment(asEquipment(value))}
          options={EQUIPMENT_OPTIONS}
        />
        <TextField
          label="Músculos trabajados"
          value={muscles}
          onChange={setMuscles}
          maxLength={EXERCISE_MUSCLES_MAX}
          autoComplete="off"
          hint="Opcional. Ej.: Pecho mayor, tríceps"
          error={musclesError}
        />
        {failure && (
          <p role="alert" className="text-body-md text-danger">
            {failure}
          </p>
        )}
        <div className="mt-2 flex flex-col gap-3">
          <Button type="submit" size="lg" fullWidth disabled={saving}>
            {editing ? 'Guardar cambios' : 'Crear ejercicio'}
          </Button>
          {editing && (
            <Button
              variant="danger"
              size="lg"
              fullWidth
              disabled={saving}
              onClick={() => {
                setFailure(null);
                setConfirming(true);
              }}
            >
              Borrar ejercicio
            </Button>
          )}
        </div>
      </form>
    </Sheet>
  );
}

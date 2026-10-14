import { Layers, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, EmptyState, Toast } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';
import { routineRepository, useActiveRoutine, useRoutines } from '../../db';
import type { Routine } from '../../domain';
import { RoutineCard } from './RoutineCard';
import { RoutineDeleteSheet, RoutineMenuSheet } from './RoutineMenuSheets';
import { RoutineNameSheet } from './RoutineNameSheet';

const TOAST_MS = 3000;

type Dialog =
  | { kind: 'create' }
  | { kind: 'menu'; routine: Routine }
  | { kind: 'rename'; routine: Routine }
  | { kind: 'delete'; routine: Routine };

export function RoutinesPage() {
  const routines = useRoutines();
  const active = useActiveRoutine();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleDone(message: string) {
    setDialog(null);
    setToast(message);
  }

  async function run(action: () => Promise<unknown>, message: string, failure: string) {
    setDialog(null);
    try {
      await action();
      setToast(message);
    } catch {
      setToast(failure);
    }
  }

  const activeId = active?.id ?? null;
  // La activa primero; el resto, por orden de creación.
  const ordered = routines
    ? [...routines.filter((r) => r.id === activeId), ...routines.filter((r) => r.id !== activeId)]
    : [];

  return (
    <>
      <PageHeader
        title="Mis Rutinas"
        description="Crea y personaliza tus planes de entreno."
        action={
          <Button pill onClick={() => setDialog({ kind: 'create' })} className="shrink-0">
            <Plus aria-hidden size={20} />
            Nueva rutina
          </Button>
        }
      />

      {routines === undefined ? (
        <ul aria-busy="true" aria-label="Cargando rutinas" className="flex flex-col gap-3">
          {[0, 1].map((index) => (
            <li
              key={index}
              className="h-32 animate-pulse rounded-lg border border-surface-container-high bg-surface-container-low"
            />
          ))}
        </ul>
      ) : routines.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Aún no tienes rutinas"
          description="Crea tu primera rutina con días rotativos."
        />
      ) : (
        <ul className="flex flex-col gap-3 pb-4">
          {ordered.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              isActive={routine.id === activeId}
              onActivate={(r) =>
                void run(
                  () => routineRepository.setActive(r.id),
                  'Rutina activada',
                  'No se pudo activar la rutina.',
                )
              }
              onMenu={(r) => setDialog({ kind: 'menu', routine: r })}
            />
          ))}
        </ul>
      )}

      {dialog?.kind === 'create' && (
        <RoutineNameSheet onClose={() => setDialog(null)} onDone={handleDone} />
      )}
      {dialog?.kind === 'rename' && (
        <RoutineNameSheet
          routine={dialog.routine}
          onClose={() => setDialog(null)}
          onDone={handleDone}
        />
      )}
      {dialog?.kind === 'menu' && (
        <RoutineMenuSheet
          routine={dialog.routine}
          onClose={() => setDialog(null)}
          onRename={() => setDialog({ kind: 'rename', routine: dialog.routine })}
          onDelete={() => setDialog({ kind: 'delete', routine: dialog.routine })}
          onDuplicate={() =>
            void run(
              () => routineRepository.duplicate(dialog.routine.id),
              'Rutina duplicada',
              'No se pudo duplicar la rutina.',
            )
          }
        />
      )}
      {dialog?.kind === 'delete' && (
        <RoutineDeleteSheet
          routine={dialog.routine}
          isActive={dialog.routine.id === activeId}
          onClose={() => setDialog(null)}
          onDone={handleDone}
        />
      )}
      <Toast message={toast} />
    </>
  );
}

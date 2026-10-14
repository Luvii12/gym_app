import { Layers } from 'lucide-react';
import { EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';

export function RoutinesPage() {
  return (
    <>
      <PageHeader title="Mis Rutinas" description="Crea y personaliza tus planes de entreno." />
      <EmptyState
        icon={Layers}
        title="Aún no tienes rutinas"
        description="Crea tu primera rutina con días rotativos."
      />
    </>
  );
}

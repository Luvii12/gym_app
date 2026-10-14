import { Dumbbell } from 'lucide-react';
import { EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';

export function ExercisesPage() {
  return (
    <>
      <PageHeader title="Catálogo de Ejercicios" />
      <EmptyState
        icon={Dumbbell}
        title="Aún no hay ejercicios"
        description="Aquí aparecerán los ejercicios del catálogo y los que crees tú."
      />
    </>
  );
}

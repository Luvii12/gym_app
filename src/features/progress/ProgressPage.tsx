import { TrendingUp } from 'lucide-react';
import { EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';

export function ProgressPage() {
  return (
    <>
      <PageHeader title="Tu Progreso" />
      <EmptyState
        icon={TrendingUp}
        title="Todavía no hay datos"
        description="Registra tu primer entreno y verás aquí tu evolución."
      />
    </>
  );
}

import { HardDrive } from 'lucide-react';
import { EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Ajustes" />
      <EmptyState
        icon={HardDrive}
        title="Tus datos, en tu dispositivo"
        description="Aquí podrás exportar, importar y borrar tu copia de seguridad."
      />
    </>
  );
}

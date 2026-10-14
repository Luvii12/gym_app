import { Flame } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button, EmptyState } from '../../components/ui';

export function TodayPage() {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={Flame}
      title="Sin rutina activa"
      description="Crea una rutina para ver aquí tu entreno de hoy."
      action={<Button onClick={() => navigate('/rutinas')}>Crear rutina</Button>}
    />
  );
}

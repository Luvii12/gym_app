import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Flame } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, EmptyState, ProgressBar, Stepper } from '.';

describe('Button', () => {
  it('es type="button" por defecto para no enviar formularios', () => {
    render(<Button>Empezar entreno</Button>);
    expect(screen.getByRole('button', { name: 'Empezar entreno' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('llama a onClick y no lo hace si está deshabilitado', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Guardar</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} disabled>
        Guardar
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Stepper', () => {
  function Harness({
    initial = 82.5,
    step = 2.5,
    min = 0,
    max,
  }: {
    initial?: number;
    step?: number;
    min?: number;
    max?: number;
  }) {
    const [value, setValue] = useState(initial);
    return (
      <Stepper
        value={value}
        onChange={setValue}
        label="peso"
        unit="kg"
        step={step}
        min={min}
        max={max}
      />
    );
  }

  it('muestra el valor con coma decimal y su unidad', () => {
    render(<Harness />);
    expect(screen.getByText('82,5')).toBeInTheDocument();
    expect(screen.getByText('kg')).toBeInTheDocument();
  });

  it('suma y resta de step en step', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Aumentar peso' }));
    expect(screen.getByText('85')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reducir peso' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reducir peso' }));
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('desactiva "reducir" en el mínimo y "aumentar" en el máximo', () => {
    const { rerender } = render(<Harness initial={0} />);
    expect(screen.getByRole('button', { name: 'Reducir peso' })).toBeDisabled();
    rerender(<Harness initial={0} max={0} />);
    expect(screen.getByRole('button', { name: 'Aumentar peso' })).toBeDisabled();
  });

  it('expone el grupo con su nombre accesible', () => {
    render(<Harness />);
    expect(screen.getByRole('group', { name: 'peso' })).toBeInTheDocument();
  });
});

describe('ProgressBar', () => {
  it('expone el progreso a los lectores de pantalla', () => {
    render(<ProgressBar value={7} max={16} label="Progreso general" />);
    const bar = screen.getByRole('progressbar', { name: 'Progreso general' });
    expect(bar).toHaveAttribute('aria-valuenow', '7');
    expect(bar).toHaveAttribute('aria-valuemax', '16');
  });

  it('acota el valor entre 0 y el máximo', () => {
    const { rerender } = render(<ProgressBar value={30} max={16} label="p" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '16');
    rerender(<ProgressBar value={-3} max={16} label="p" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('no revienta con un máximo de 0', () => {
    render(<ProgressBar value={0} max={0} label="vacío" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});

describe('EmptyState', () => {
  it('muestra título, descripción y acción', () => {
    render(
      <EmptyState
        icon={Flame}
        title="Sin rutina activa"
        description="Crea una rutina para empezar a entrenar."
        action={<Button>Crear rutina</Button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Sin rutina activa' })).toBeInTheDocument();
    expect(screen.getByText('Crea una rutina para empezar a entrenar.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear rutina' })).toBeInTheDocument();
  });
});

describe('Card y Badge', () => {
  it('renderizan su contenido', () => {
    render(
      <Card>
        <Badge variant="accent">Activa</Badge>
      </Card>,
    );
    expect(screen.getByText('Activa')).toBeInTheDocument();
  });
});

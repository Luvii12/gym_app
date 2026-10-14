import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Badge, Chip, SearchField } from '.';

describe('Chip', () => {
  it('expone selected como aria-pressed', () => {
    const { rerender } = render(<Chip selected={false}>Pecho</Chip>);
    expect(screen.getByRole('button', { name: 'Pecho' })).toHaveAttribute('aria-pressed', 'false');

    rerender(<Chip selected>Pecho</Chip>);
    expect(screen.getByRole('button', { name: 'Pecho' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('es type="button" por defecto y respeta un type explícito', () => {
    const { rerender } = render(<Chip selected={false}>Todos</Chip>);
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('type', 'button');

    rerender(
      <Chip selected={false} type="submit">
        Todos
      </Chip>,
    );
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('type', 'submit');
  });

  it('llama a onClick al pulsarlo', async () => {
    const onClick = vi.fn();
    render(
      <Chip selected={false} onClick={onClick}>
        Espalda
      </Chip>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Espalda' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('no llama a onClick si está deshabilitado', async () => {
    const onClick = vi.fn();
    render(
      <Chip selected={false} onClick={onClick} disabled>
        Espalda
      </Chip>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Espalda' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('SearchField', () => {
  function Harness({ onChange }: { onChange?: (value: string) => void }) {
    const [value, setValue] = useState('');
    return (
      <SearchField
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
        label="Buscar ejercicio"
        placeholder="Buscar…"
      />
    );
  }

  it('tiene una etiqueta accesible y es un campo de búsqueda', () => {
    render(<Harness />);
    const field = screen.getByRole('searchbox', { name: 'Buscar ejercicio' });
    expect(field).toHaveAttribute('placeholder', 'Buscar…');
    expect(field).toHaveValue('');
  });

  it('oculta "Borrar búsqueda" con el campo vacío y lo muestra al escribir', async () => {
    render(<Harness />);
    expect(screen.queryByRole('button', { name: 'Borrar búsqueda' })).not.toBeInTheDocument();

    await userEvent.type(screen.getByRole('searchbox'), 'a');
    expect(screen.getByRole('button', { name: 'Borrar búsqueda' })).toBeInTheDocument();
  });

  it('llama a onChange con el valor completo en cada pulsación', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.type(screen.getByRole('searchbox'), 'pre');

    expect(onChange.mock.calls.map(([value]) => value)).toEqual(['p', 'pr', 'pre']);
    expect(screen.getByRole('searchbox')).toHaveValue('pre');
  });

  it('"Borrar búsqueda" llama a onChange con cadena vacía, se oculta y no es type submit', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.type(screen.getByRole('searchbox'), 'ab');

    const clear = screen.getByRole('button', { name: 'Borrar búsqueda' });
    expect(clear).toHaveAttribute('type', 'button');
    await userEvent.click(clear);

    expect(onChange).toHaveBeenLastCalledWith('');
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Borrar búsqueda' })).not.toBeInTheDocument();
  });

  it('muestra el valor controlado que recibe', () => {
    render(<SearchField value="remo" onChange={() => {}} label="Buscar" />);
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('remo');
    expect(screen.getByRole('button', { name: 'Borrar búsqueda' })).toBeInTheDocument();
  });
});

describe('Badge variante group', () => {
  it('renderiza el texto con el estilo de grupo muscular', () => {
    render(<Badge variant="group">Pecho</Badge>);
    expect(screen.getByText('Pecho')).toHaveClass('text-accent', 'bg-surface-container-high');
  });
});

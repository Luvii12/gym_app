import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { SelectField, TextField, Toast } from '.';

describe('TextField', () => {
  function Harness({
    onChange,
    error,
    hint,
  }: {
    onChange?: (value: string) => void;
    error?: string;
    hint?: string;
  }) {
    const [value, setValue] = useState('');
    return (
      <TextField
        label="Nombre"
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
        error={error}
        hint={hint}
      />
    );
  }

  it('asocia la etiqueta con el campo', () => {
    render(<Harness />);
    const field = screen.getByLabelText('Nombre');
    expect(field).toBe(screen.getByRole('textbox', { name: 'Nombre' }));
    expect(field).toHaveAttribute('type', 'text');
  });

  it('sin error ni pista no declara aria-invalid ni aria-describedby', () => {
    render(<Harness />);
    const field = screen.getByRole('textbox', { name: 'Nombre' });
    expect(field).not.toHaveAttribute('aria-invalid');
    expect(field).not.toHaveAttribute('aria-describedby');
  });

  it('con error marca aria-invalid y lo enlaza con aria-describedby', () => {
    render(<Harness error="Escribe un nombre." />);
    const field = screen.getByRole('textbox', { name: 'Nombre' });
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('Escribe un nombre.');
    expect(screen.getByText('Escribe un nombre.')).toBeVisible();
  });

  it('con pista la enlaza con aria-describedby sin marcar el campo como inválido', () => {
    render(<Harness hint="Opcional." />);
    const field = screen.getByRole('textbox', { name: 'Nombre' });
    expect(field).not.toHaveAttribute('aria-invalid');
    expect(field).toHaveAccessibleDescription('Opcional.');
  });

  it('con error y pista describe el campo con ambos, primero el error', () => {
    render(<Harness error="Mal." hint="Pista." />);
    const field = screen.getByRole('textbox', { name: 'Nombre' });
    expect(field).toHaveAccessibleDescription('Mal. Pista.');
  });

  it('llama a onChange con el valor completo en cada pulsación', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Nombre' }), 'abc');

    expect(onChange.mock.calls.map(([value]) => value)).toEqual(['a', 'ab', 'abc']);
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveValue('abc');
  });

  it('reenvía atributos nativos como maxLength y placeholder', () => {
    render(
      <TextField label="Nombre" value="" onChange={() => {}} maxLength={5} placeholder="Ej." />,
    );
    const field = screen.getByRole('textbox', { name: 'Nombre' });
    expect(field).toHaveAttribute('maxlength', '5');
    expect(field).toHaveAttribute('placeholder', 'Ej.');
  });

  it('dos campos tienen ids distintos', () => {
    render(
      <>
        <TextField label="Uno" value="" onChange={() => {}} />
        <TextField label="Dos" value="" onChange={() => {}} />
      </>,
    );
    expect(screen.getByLabelText('Uno').id).not.toBe(screen.getByLabelText('Dos').id);
  });
});

describe('SelectField', () => {
  const OPTIONS = [
    { value: 'chest', label: 'Pecho' },
    { value: 'back', label: 'Espalda' },
    { value: 'legs', label: 'Piernas' },
  ];

  function Harness({
    onChange,
    error,
    hint,
  }: {
    onChange?: (value: string) => void;
    error?: string;
    hint?: string;
  }) {
    const [value, setValue] = useState('chest');
    return (
      <SelectField
        label="Grupo muscular"
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
        options={OPTIONS}
        error={error}
        hint={hint}
      />
    );
  }

  it('asocia la etiqueta con el desplegable y lista todas las opciones', () => {
    render(<Harness />);
    const select = screen.getByRole('combobox', { name: 'Grupo muscular' });
    expect(select).toHaveValue('chest');
    expect(Array.from(select.querySelectorAll('option')).map((o) => o.textContent)).toEqual([
      'Pecho',
      'Espalda',
      'Piernas',
    ]);
  });

  it('muestra seleccionada la opción del valor controlado', () => {
    render(<SelectField label="Grupo" value="legs" onChange={() => {}} options={OPTIONS} />);
    expect(screen.getByRole('combobox', { name: 'Grupo' })).toHaveDisplayValue('Piernas');
  });

  it('llama a onChange con el value (no con la etiqueta) de la opción elegida', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Grupo muscular' }),
      'Espalda',
    );

    expect(onChange).toHaveBeenCalledWith('back');
    expect(screen.getByRole('combobox', { name: 'Grupo muscular' })).toHaveValue('back');
  });

  it('sin error ni pista no declara aria-invalid ni aria-describedby', () => {
    render(<Harness />);
    const select = screen.getByRole('combobox', { name: 'Grupo muscular' });
    expect(select).not.toHaveAttribute('aria-invalid');
    expect(select).not.toHaveAttribute('aria-describedby');
  });

  it('con error marca aria-invalid y lo enlaza con aria-describedby', () => {
    render(<Harness error="Elige un grupo." />);
    const select = screen.getByRole('combobox', { name: 'Grupo muscular' });
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Elige un grupo.');
  });

  it('con pista la enlaza con aria-describedby', () => {
    render(<Harness hint="Elige uno." />);
    expect(screen.getByRole('combobox', { name: 'Grupo muscular' })).toHaveAccessibleDescription(
      'Elige uno.',
    );
  });
});

describe('Toast', () => {
  it('siempre pinta un contenedor role=status vacío sin mensaje', () => {
    render(<Toast message={null} />);
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('muestra el mensaje dentro del contenedor y lo quita al pasar a null', () => {
    const { rerender } = render(<Toast message="Ejercicio creado" />);
    expect(screen.getByRole('status')).toHaveTextContent('Ejercicio creado');

    rerender(<Toast message={null} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});

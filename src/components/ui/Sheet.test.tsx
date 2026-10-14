import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { Sheet } from '.';

interface HarnessProps {
  onClose?: () => void;
  children?: ReactNode;
  initiallyOpen?: boolean;
}

/** Un botón que abre la hoja; "Cerrar" de la hoja (o Escape, o el fondo) la cierra. */
function Harness({ onClose, children, initiallyOpen = false }: HarnessProps) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir hoja
      </button>
      <Sheet
        open={open}
        title="Mi hoja"
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
      >
        {children ?? (
          <>
            <button type="button">Primero</button>
            <input aria-label="Medio" />
            <button type="button">Último</button>
          </>
        )}
      </Sheet>
    </>
  );
}

afterEach(() => {
  document.body.style.overflow = '';
});

describe('Sheet', () => {
  it('no pinta nada cuando está cerrada', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sheet-backdrop')).not.toBeInTheDocument();
    expect(screen.queryByText('Primero')).not.toBeInTheDocument();
  });

  it('abierta es un diálogo modal cuyo nombre accesible es el título', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));

    const dialog = screen.getByRole('dialog', { name: 'Mi hoja' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Mi hoja' })).toBeVisible();
    expect(within(dialog).getByRole('button', { name: 'Primero' })).toBeVisible();
  });

  it('se pinta en un portal bajo document.body, fuera del árbol del padre', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));

    const dialog = screen.getByRole('dialog');
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it('Escape llama a onClose y cierra', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('pulsar el fondo cierra, pero pulsar dentro de la hoja no', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));

    await user.click(screen.getByRole('heading', { name: 'Mi hoja' }));
    await user.click(screen.getByRole('button', { name: 'Primero' }));
    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByTestId('sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('el botón "Cerrar" cierra', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('el foco inicial cae en el primer elemento enfocable del contenido', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));

    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus();
  });

  it('si el contenido no tiene nada enfocable, el foco cae en "Cerrar"', async () => {
    const user = userEvent.setup();
    render(
      <Harness>
        <p>Solo texto</p>
      </Harness>,
    );
    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));

    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
  });

  it('respeta un autoFocus del contenido', async () => {
    const user = userEvent.setup();
    render(
      <Harness>
        <button type="button">Primero</button>
        <input aria-label="Con foco" autoFocus />
      </Harness>,
    );
    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));

    expect(screen.getByRole('textbox', { name: 'Con foco' })).toHaveFocus();
  });

  it('al cerrar, el foco vuelve al botón que la abrió (por Escape, por fondo y por "Cerrar")', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Abrir hoja' });

    await user.click(opener);
    await user.keyboard('{Escape}');
    expect(opener).toHaveFocus();

    await user.click(opener);
    await user.click(screen.getByTestId('sheet-backdrop'));
    expect(opener).toHaveFocus();

    await user.click(opener);
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(opener).toHaveFocus();
  });

  it('al cerrar con un autoFocus dentro, el foco también vuelve al botón de origen', async () => {
    const user = userEvent.setup();
    render(
      <Harness>
        <input aria-label="Con foco" autoFocus />
      </Harness>,
    );
    const opener = screen.getByRole('button', { name: 'Abrir hoja' });
    await user.click(opener);
    expect(screen.getByRole('textbox', { name: 'Con foco' })).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(opener).toHaveFocus();
  });

  it('Tab desde el último elemento vuelve al primero', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));
    // El último enfocable de la hoja es el último del contenido.
    screen.getByRole('button', { name: 'Último' }).focus();

    await user.tab();

    // El primero de la hoja es el botón "Cerrar" de la cabecera.
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
  });

  it('Shift+Tab desde el primer elemento va al último', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));
    screen.getByRole('button', { name: 'Cerrar' }).focus();

    await user.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus();
  });

  it('Tab entre elementos intermedios avanza con normalidad dentro de la hoja', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));
    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Medio' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus();
  });

  it('bloquea el scroll del body abierta y lo restaura al cerrar', async () => {
    const user = userEvent.setup();
    document.body.style.overflow = 'auto';
    render(<Harness />);
    expect(document.body.style.overflow).toBe('auto');

    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('auto');
  });

  it('restaura el scroll del body si la hoja se desmonta abierta', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));
    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });

  it('deja de escuchar Escape una vez cerrada', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('si el contenido se re-renderiza no roba el foco ni reabre efectos', async () => {
    const user = userEvent.setup();
    function Counter() {
      const [count, setCount] = useState(0);
      return (
        <>
          <button type="button">Primero</button>
          <button type="button" onClick={() => setCount((c) => c + 1)}>
            Sumar {count}
          </button>
        </>
      );
    }
    render(
      <Harness>
        <Counter />
      </Harness>,
    );
    await user.click(screen.getByRole('button', { name: 'Abrir hoja' }));

    await user.click(screen.getByRole('button', { name: 'Sumar 0' }));

    expect(screen.getByRole('button', { name: 'Sumar 1' })).toHaveFocus();
  });
});

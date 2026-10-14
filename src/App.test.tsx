import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from './app/AppRoutes';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('navegación', () => {
  it('abre en Hoy con la marca y las 4 pestañas', async () => {
    renderAt('/');
    expect(screen.getByRole('link', { name: /gym routine/i })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Hoy', 'Rutinas', 'Ejercicios', 'Progreso']);
    expect(await screen.findByRole('heading', { name: 'Sin rutina activa' })).toBeInTheDocument();
  });

  it('marca la pestaña actual', () => {
    renderAt('/rutinas');
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).getByRole('link', { name: 'Rutinas' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Hoy' })).not.toHaveAttribute('aria-current');
  });

  it('cambia de pantalla al pulsar una pestaña', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('link', { name: 'Ejercicios' }));
    expect(screen.getByRole('heading', { name: 'Catálogo de Ejercicios' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Progreso' }));
    expect(screen.getByRole('heading', { name: 'Tu Progreso' })).toBeInTheDocument();
  });

  it('el engranaje lleva a Ajustes', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('link', { name: 'Ajustes' }));
    expect(screen.getByRole('heading', { name: 'Ajustes' })).toBeInTheDocument();
  });

  it('"Crear rutina" lleva a Rutinas', async () => {
    renderAt('/');
    await userEvent.click(await screen.findByRole('button', { name: 'Crear rutina' }));
    expect(screen.getByRole('heading', { name: 'Mis Rutinas' })).toBeInTheDocument();
  });

  it('una ruta desconocida vuelve a Hoy', async () => {
    renderAt('/no-existe');
    expect(await screen.findByRole('heading', { name: 'Sin rutina activa' })).toBeInTheDocument();
  });
});

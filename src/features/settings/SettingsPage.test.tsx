import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '../../db';
import { parseBackup, type Exercise, type Routine, type WorkoutSession } from '../../domain';
import { SettingsPage } from './SettingsPage';

const custom: Exercise = {
  id: 'mine',
  name: 'Mi ejercicio',
  muscleGroup: 'chest',
  equipment: 'barbell',
  isCustom: true,
};

function session(id: string): WorkoutSession {
  return {
    id,
    name: id,
    startedAt: 1000,
    endedAt: 5000,
    sets: [{ exerciseId: 'mine', setIndex: 0, weightKg: 50, reps: 5, completedAt: 2000 }],
  };
}

const routine: Routine = { id: 'r1', name: 'Rutina', daysPerWeek: 3, days: [], createdAt: 1 };

async function seed(n: number) {
  await db.sessions.clear();
  await db.routines.clear();
  await db.exercises.clear();
  await db.settings.clear();
  await db.exercises.put(custom);
  await db.routines.put(routine);
  await db.sessions.bulkPut(Array.from({ length: n }, (_, i) => session(`s${i}`)));
}

function fileOf(content: string) {
  return new File([content], 'copia.json', { type: 'application/json' });
}

function validBackupJson(sessions: WorkoutSession[], routines: Routine[] = []) {
  return JSON.stringify({
    format: 'gym-routine-backup',
    version: 1,
    exportedAt: Date.UTC(2026, 0, 15),
    exercises: [],
    routines,
    sessions,
    settings: [],
  });
}

beforeEach(async () => {
  await seed(3);
});

describe('SettingsPage', () => {
  it('muestra el contador de entrenos', async () => {
    render(<SettingsPage />);
    expect(await screen.findByText('3 entrenos guardados en este dispositivo')).toBeVisible();
  });

  it('singular y vacío', async () => {
    await seed(1);
    const { unmount } = render(<SettingsPage />);
    expect(await screen.findByText('1 entreno guardado en este dispositivo')).toBeVisible();
    unmount();
    await seed(0);
    render(<SettingsPage />);
    expect(await screen.findByText('Aún no hay entrenos')).toBeVisible();
  });

  it('exporta un backup válido', async () => {
    const blobs: Blob[] = [];
    URL.createObjectURL = vi.fn((b: Blob | MediaSource) => {
      blobs.push(b as Blob);
      return 'blob:x';
    });
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<SettingsPage />);
    await userEvent.click(screen.getByRole('button', { name: /Exportar copia/ }));
    expect(await screen.findByText('Copia exportada')).toBeVisible();
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
    const parsed = parseBackup(JSON.parse(await blobs[0].text()));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.backup.sessions).toHaveLength(3);
    click.mockRestore();
  });

  it('importa un archivo válido tras confirmar y sustituye los datos', async () => {
    render(<SettingsPage />);
    const input = screen.getByLabelText('Archivo de copia de seguridad');
    fireEvent.change(input, {
      target: {
        files: [fileOf(validBackupJson([session('n1')], [routine, { ...routine, id: 'r2' }]))],
      },
    });
    expect(await screen.findByText(/1 entreno · 2 rutinas · 0 ejercicios propios/)).toBeVisible();
    expect(screen.getByText(/sustituye todos tus datos/)).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Importar y sustituir' }));
    expect(await screen.findByText('Copia importada')).toBeVisible();
    expect((await db.sessions.toArray()).map((s) => s.id)).toEqual(['n1']);
    expect(await db.routines.count()).toBe(2);
    expect(await db.exercises.count()).toBe(0);
  });

  it('archivo inválido: error y datos intactos', async () => {
    render(<SettingsPage />);
    const input = screen.getByLabelText('Archivo de copia de seguridad');
    fireEvent.change(input, { target: { files: [fileOf('esto no es json')] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('JSON');
    fireEvent.change(input, { target: { files: [fileOf('{"format":"otro"}')] } });
    await waitFor(() => expect(screen.getByRole('alert')).toBeVisible());
    expect(screen.queryByRole('button', { name: 'Importar y sustituir' })).toBeNull();
    expect(await db.sessions.count()).toBe(3);
  });

  it('cancelar la importación no cambia nada', async () => {
    render(<SettingsPage />);
    fireEvent.change(screen.getByLabelText('Archivo de copia de seguridad'), {
      target: { files: [fileOf(validBackupJson([]))] },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    expect(await db.sessions.count()).toBe(3);
    expect(await db.routines.count()).toBe(1);
  });

  it('borra todo tras confirmar', async () => {
    render(<SettingsPage />);
    await screen.findByText('3 entrenos guardados en este dispositivo');
    await userEvent.click(screen.getByRole('button', { name: 'Borrar todos los datos' }));
    expect(await screen.findByText(/Se perderán 3 entrenos/)).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Borrar todo' }));
    expect(await screen.findByText('Datos borrados')).toBeVisible();
    expect(await db.sessions.count()).toBe(0);
    expect(await db.routines.count()).toBe(0);
  });

  it('cancelar el borrado conserva los datos', async () => {
    render(<SettingsPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Borrar todos los datos' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    expect(await db.sessions.count()).toBe(3);
  });
});

describe('almacenamiento persistente', () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'storage');
  afterEach(() => {
    if (original) Object.defineProperty(navigator, 'storage', original);
    else Reflect.deleteProperty(navigator, 'storage');
  });

  function mockStorage(persisted: boolean, grants: boolean) {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: {
        persisted: vi.fn().mockResolvedValue(persisted),
        persist: vi.fn().mockResolvedValue(grants),
      },
    });
  }

  it('indica que está protegido cuando el navegador lo ha concedido', async () => {
    mockStorage(true, true);
    render(<SettingsPage />);
    expect(await screen.findByText(/Almacenamiento protegido/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Proteger mis datos' })).toBeNull();
  });

  it('ofrece protegerlo y lo pide al pulsar', async () => {
    mockStorage(false, true);
    const user = userEvent.setup();
    render(<SettingsPage />);
    await user.click(await screen.findByRole('button', { name: 'Proteger mis datos' }));
    expect(await screen.findByText(/Almacenamiento protegido/)).toBeVisible();
  });

  it('si el navegador lo deniega avisa y sigue ofreciéndolo', async () => {
    mockStorage(false, false);
    const user = userEvent.setup();
    render(<SettingsPage />);
    await user.click(await screen.findByRole('button', { name: 'Proteger mis datos' }));
    expect(await screen.findByText(/no ha concedido la protección/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Proteger mis datos' })).toBeVisible();
  });
});

import { Download, HardDrive, ShieldAlert, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button, Card, Sheet, Toast } from '../../components/ui';
import { PageHeader } from '../../components/PageHeader';
import { backupRepository, useWorkoutCount } from '../../db';
import { parseBackup, summarizeBackup, type Backup } from '../../domain';

import { persistenceState, requestPersistence, type PersistenceState } from '../../lib/storage';

const TOAST_MS = 3000;

function workoutsLabel(n: number): string {
  if (n === 0) return 'Aún no hay entrenos';
  return n === 1
    ? '1 entreno guardado en este dispositivo'
    : `${n} entrenos guardados en este dispositivo`;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function isoDay(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function downloadJson(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SettingsPage() {
  const count = useWorkoutCount();
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [persistence, setPersistence] = useState<PersistenceState | null>(null);

  useEffect(() => {
    void persistenceState().then(setPersistence);
  }, []);

  async function protect() {
    const next = await requestPersistence();
    setPersistence(next);
    if (next !== 'persisted') {
      setToast('El navegador no ha concedido la protección. Exporta copias con frecuencia.');
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleExport() {
    try {
      const backup = await backupRepository.export();
      downloadJson(JSON.stringify(backup, null, 2), `gym-routine-${isoDay(Date.now())}.json`);
      setToast('Copia exportada');
    } catch {
      setToast('No se pudo exportar la copia.');
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        setImportError('El archivo no es un JSON válido.');
        return;
      }
      const result = parseBackup(json);
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      setSheetError(null);
      setPending(result.backup);
    } catch {
      setImportError('No se pudo leer el archivo.');
    } finally {
      input.value = '';
    }
  }

  async function confirmImport() {
    if (!pending) return;
    setBusy(true);
    setSheetError(null);
    try {
      await backupRepository.import(pending);
      setPending(null);
      setToast('Copia importada');
    } catch {
      setSheetError('No se pudo importar la copia. Tus datos no han cambiado.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmClearAll() {
    setBusy(true);
    setSheetError(null);
    try {
      await backupRepository.clearAll();
      setConfirmClear(false);
      setToast('Datos borrados');
    } catch {
      setSheetError('No se pudieron borrar los datos.');
    } finally {
      setBusy(false);
    }
  }

  const summary = pending ? summarizeBackup(pending) : null;

  return (
    <>
      <PageHeader title="Ajustes" />
      <div className="flex flex-col gap-4 pb-4">
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            <HardDrive aria-hidden className="size-5 text-accent" />
            <h2 className="text-headline-sm">Almacenamiento local (100 % offline)</h2>
          </div>
          <p className="text-body-md text-muted">
            Tus datos viven solo en este dispositivo. No hay cuenta ni servidor: nada se envía a
            internet.
          </p>
          <p className="text-label-lg tabular-nums">
            {count === undefined ? ' ' : workoutsLabel(count)}
          </p>
          {persistence === 'persisted' && (
            <p className="flex items-center gap-2 text-body-md text-muted">
              <ShieldCheck aria-hidden className="size-5 shrink-0 text-success" />
              Almacenamiento protegido: el navegador no borrará tus datos al faltar espacio.
            </p>
          )}
          {persistence === 'best-effort' && (
            <>
              <p className="flex items-center gap-2 text-body-md text-muted">
                <ShieldAlert aria-hidden className="size-5 shrink-0 text-rest" />
                El navegador podría borrar los datos si le falta espacio.
              </p>
              <Button variant="secondary" fullWidth onClick={() => void protect()}>
                Proteger mis datos
              </Button>
            </>
          )}
        </Card>

        <Card className="flex flex-col gap-3 p-4">
          <h2 className="text-headline-sm">Copia de seguridad</h2>
          <Button variant="secondary" fullWidth onClick={() => void handleExport()}>
            <Download aria-hidden className="size-5" />
            Exportar copia (JSON)
          </Button>
          <Button variant="secondary" fullWidth onClick={() => fileRef.current?.click()}>
            <Upload aria-hidden className="size-5" />
            Importar copia de seguridad
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            aria-label="Archivo de copia de seguridad"
            tabIndex={-1}
            className="sr-only"
            onChange={(e) => void handleFile(e)}
          />
          {importError && (
            <p role="alert" className="text-body-md text-danger">
              {importError}
            </p>
          )}
        </Card>

        <Card className="flex flex-col gap-3 border-danger/40 p-4">
          <h2 className="text-headline-sm text-danger">Zona de peligro</h2>
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              setSheetError(null);
              setConfirmClear(true);
            }}
          >
            <Trash2 aria-hidden className="size-5" />
            Borrar todos los datos
          </Button>
        </Card>
      </div>

      <Sheet
        open={pending !== null}
        onClose={() => !busy && setPending(null)}
        title="¿Importar esta copia?"
      >
        {summary && pending && (
          <>
            <p className="mb-1 text-headline-md tabular-nums">
              {plural(summary.workouts, 'entreno', 'entrenos')} ·{' '}
              {plural(summary.routines, 'rutina', 'rutinas')} ·{' '}
              {plural(summary.customExercises, 'ejercicio propio', 'ejercicios propios')}
            </p>
            <p className="mb-3 text-body-md text-muted tabular-nums">
              Copia del {isoDay(pending.exportedAt)}
            </p>
            <p className="mb-4 text-body-md">
              Esto sustituye todos tus datos actuales por los de la copia. No se puede deshacer.
            </p>
            {sheetError && (
              <p role="alert" className="mb-3 text-body-md text-danger">
                {sheetError}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button size="lg" fullWidth disabled={busy} onClick={() => void confirmImport()}>
                Importar y sustituir
              </Button>
              <Button
                variant="secondary"
                fullWidth
                disabled={busy}
                onClick={() => setPending(null)}
              >
                Cancelar
              </Button>
            </div>
          </>
        )}
      </Sheet>

      <Sheet
        open={confirmClear}
        onClose={() => !busy && setConfirmClear(false)}
        title="¿Borrar todos los datos?"
      >
        <p className="mb-2 text-body-md tabular-nums">
          {`Se perderán ${plural(count ?? 0, 'entreno', 'entrenos')}, tus rutinas y tus ejercicios propios. No se puede deshacer.`}
        </p>
        <p className="mb-4 text-body-md text-muted">
          Te recomendamos exportar una copia antes de borrar.
        </p>
        {sheetError && (
          <p role="alert" className="mb-3 text-body-md text-danger">
            {sheetError}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Button variant="danger" fullWidth disabled={busy} onClick={() => void confirmClearAll()}>
            Borrar todo
          </Button>
          <Button
            variant="secondary"
            fullWidth
            disabled={busy}
            onClick={() => setConfirmClear(false)}
          >
            Cancelar
          </Button>
        </div>
      </Sheet>

      <Toast message={toast} />
    </>
  );
}

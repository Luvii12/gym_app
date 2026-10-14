import { expect, test, type Page } from '@playwright/test';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Crea una rutina con un día y un ejercicio (press banca) y vuelve a Hoy. */
async function createRoutineWithOneDay(page: Page) {
  await page.goto('/rutinas');
  await page.getByRole('button', { name: 'Nueva rutina' }).click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Nombre' }).fill('Mi PPL');
  await page.getByRole('button', { name: 'Crear rutina' }).click();
  await page.getByRole('link', { name: 'Editar Mi PPL' }).click();
  await page.getByRole('button', { name: 'Añadir día de entreno' }).click();
  await page.getByRole('link', { name: /Editar ejercicios de Día 1/ }).click();
  await page.getByRole('button', { name: /Añadir ejercicio desde catálogo/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('searchbox').fill('press banca con barra');
  await dialog
    .getByRole('button', { name: /^Añadir / })
    .first()
    .click();
  await dialog.getByRole('button', { name: 'Cerrar' }).click();
  await expect(
    page.getByRole('list', { name: 'Ejercicios del día' }).getByRole('heading'),
  ).toHaveCount(1);
  await page.goto('/');
}

/** Inserta sesiones terminadas del ejercicio de la última sesión, hace 21 y 14 días. */
async function seedPastSessions(page: Page) {
  await page.evaluate(
    (day) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('gym-routine');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('sessions', 'readwrite');
          const store = tx.objectStore('sessions');
          const all = store.getAll();
          all.onsuccess = () => {
            const base = (
              all.result as { startedAt: number; sets: { exerciseId: string }[] }[]
            )[0]!;
            const exerciseId = base.sets[0]!.exerciseId;
            const make = (id: string, daysAgo: number, weightKg: number) => {
              const startedAt = base.startedAt - daysAgo * day;
              store.put({
                id,
                name: 'Día 1',
                startedAt,
                endedAt: startedAt + 45 * 60 * 1000,
                sets: [0, 1].map((setIndex) => ({
                  exerciseId,
                  setIndex,
                  weightKg,
                  reps: 8,
                  completedAt: startedAt + (setIndex + 1) * 60 * 1000,
                })),
              });
            };
            make('seed-old-1', 21, 15);
            make('seed-old-2', 14, 17.5);
          };
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    DAY_MS,
  );
}

test('progreso: Hoy, Progreso, Historial, edición y borrado del entreno', async ({ page }) => {
  await createRoutineWithOneDay(page);
  await page.getByRole('button', { name: 'Empezar entreno' }).click();
  await expect(page).toHaveURL(/\/entreno$/);

  // Dos series de 20 kg x 8 (el peso arranca en 0 y sube de 2,5 en 2,5).
  for (const n of [1, 2]) {
    for (let i = 0; i < 8; i++) {
      await page
        .getByRole('button', { name: new RegExp(`^Aumentar peso de la serie ${n} `) })
        .click();
    }
    await page.getByRole('button', { name: new RegExp(`^Completar serie ${n} de`) }).click();
    await page.getByRole('button', { name: 'Saltar', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Terminar', exact: true }).click();
  await page.getByRole('button', { name: 'Terminar entreno' }).click();
  await expect(page.getByText('Entreno guardado')).toBeVisible();

  // Sesiones anteriores de semanas distintas: 15 kg x 8 y 17,5 kg x 8.
  await seedPastSessions(page);
  await page.reload();

  // Hoy: último entreno (volumen 2 x 20 x 8 = 320 kg).
  const last = page.getByRole('link', { name: /Último entreno/ });
  await expect(last).toBeVisible();
  await expect(last).toContainText('320 kg');

  // Progreso: 1RM Epley 20 x (1 + 8/30) = 25,33 -> 25,5 (redondeo a 0,5).
  await page.goto('/progreso');
  const oneRm = page
    .getByRole('heading', { name: /Histórico de cargas/ })
    .locator('xpath=ancestor::div[2]');
  await expect(oneRm).toContainText('25,5');
  const weekly = page.getByText('Esta semana').locator('xpath=preceding-sibling::p[1]');
  await expect(weekly).toContainText('320');
  const records = page.getByRole('region', { name: /Récords personales/ });
  const prCard = records.getByRole('listitem').first();
  await expect(prCard).toContainText('Press banca inclinado con barra');
  await expect(prCard).toContainText('25,33');
  await expect(prCard).toContainText('20 kg × 8');
  // Mejora respecto al anterior: 25,33 - 22,17 = 3,17 kg.
  await expect(prCard).toContainText('+3,17 kg');
  await expect(page.getByText('3 entrenos')).toBeVisible();

  // Historial: 3 entrenos; el más reciente primero.
  await page
    .getByRole('link', { name: /Historial/ })
    .first()
    .click();
  const list = page.getByRole('main').getByRole('listitem');
  await expect(list).toHaveCount(3);
  await expect(list.first()).toContainText('320 kg');
  await list.first().getByRole('link').click();

  // Detalle: editar el peso de la serie 1 (20 -> 22,5) cambia el volumen a 340 kg.
  await expect(page.getByText(/320 kg de volumen/)).toBeVisible();
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByRole('button', { name: /^Aumentar peso de la serie 1 / }).click();
  await expect(page.getByText(/340 kg de volumen/)).toBeVisible();
  await page.getByRole('button', { name: 'Listo' }).click();
  await expect(page.getByText('22,5 kg × 8')).toBeVisible();

  // Borrar: queda el historial con los 2 entrenos sembrados; se borran también.
  await page.getByRole('button', { name: 'Borrar entreno' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Borrar entreno' }).click();
  await expect(page).toHaveURL(/\/progreso\/historial$/);
  await expect(list).toHaveCount(2);
});

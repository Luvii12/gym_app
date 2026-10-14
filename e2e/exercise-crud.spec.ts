import { expect, test, type Locator, type Page } from '@playwright/test';
import { SEED_EXERCISES } from '../src/data/exercises';

const TOTAL = SEED_EXERCISES.length;
const NAME = 'Face pull con cuerda';

interface StoredExercise {
  id: string;
  name: string;
  isCustom: boolean;
  archivedAt?: number;
}

function countLabel(count: number): string {
  return count === 1 ? '1 ejercicio' : `${count} ejercicios`;
}

/** Lee todo un store con la API nativa de IndexedDB: comprueba la base real, no el repositorio. */
async function readStore<T>(page: Page, store: string): Promise<T[]> {
  return page.evaluate(
    (storeName) =>
      new Promise<unknown[]>((resolve, reject) => {
        const open = indexedDB.open('gym-routine');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const database = open.result;
          const request = database.transaction(storeName).objectStore(storeName).getAll();
          request.onsuccess = () => {
            database.close();
            resolve(request.result);
          };
          request.onerror = () => {
            database.close();
            reject(request.error);
          };
        };
      }),
    store,
  ) as Promise<T[]>;
}

async function insertSession(page: Page, exerciseId: string): Promise<void> {
  await page.evaluate(
    (id) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('gym-routine');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const database = open.result;
          const tx = database.transaction('sessions', 'readwrite');
          tx.objectStore('sessions').add({
            id: 'e2e-session-1',
            name: 'Hombros',
            startedAt: 1_700_000_000_000,
            endedAt: 1_700_000_900_000,
            sets: [
              {
                exerciseId: id,
                setIndex: 0,
                weightKg: 20,
                reps: 10,
                completedAt: 1_700_000_500_000,
              },
            ],
          });
          tx.oncomplete = () => {
            database.close();
            resolve();
          };
          tx.onerror = () => {
            database.close();
            reject(tx.error);
          };
        };
      }),
    exerciseId,
  );
}

async function mine(page: Page): Promise<StoredExercise[]> {
  return (await readStore<StoredExercise>(page, 'exercises')).filter((e) => e.isCustom);
}

function fab(page: Page): Locator {
  return page.getByRole('button', { name: 'Nuevo ejercicio' });
}

function dialog(page: Page): Locator {
  return page.getByRole('dialog');
}

async function waitForCatalog(page: Page, total: number) {
  await expect(page.getByRole('heading', { name: 'Catálogo de Ejercicios' })).toBeVisible();
  await expect(page.getByText(countLabel(total), { exact: true })).toBeVisible();
}

async function createExercise(page: Page, name: string) {
  await fab(page).click();
  const sheet = dialog(page);
  await sheet.getByRole('textbox', { name: 'Nombre' }).fill(name);
  await sheet.getByRole('button', { name: 'Crear ejercicio' }).click();
  await expect(sheet).toHaveCount(0);
}

function card(page: Page, name: string): Locator {
  return page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name, exact: true }) });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/ejercicios');
  // El catálogo se carga al arrancar: esperamos a que se vea completo.
  await waitForCatalog(page, TOTAL);
});

test('crear, recargar, editar, rechazar un duplicado y borrar un ejercicio propio', async ({
  page,
}) => {
  // Crear desde el botón flotante.
  await createExercise(page, NAME);
  await expect(page.getByRole('status')).toHaveText('Ejercicio creado');
  await waitForCatalog(page, TOTAL + 1);
  await expect(card(page, NAME).getByText('Personalizado')).toBeVisible();
  await expect(card(page, NAME).getByText('Predeterminado')).toHaveCount(0);
  await expect(fab(page)).toBeFocused();

  // Persiste tras recargar.
  await page.reload();
  await waitForCatalog(page, TOTAL + 1);
  await expect(card(page, NAME).getByText('Personalizado')).toBeVisible();
  expect((await mine(page)).map((e) => e.name)).toEqual([NAME]);

  // Editar su nombre.
  await page.getByRole('button', { name: `Editar ${NAME}` }).click();
  const edit = dialog(page);
  await expect(edit).toHaveAccessibleName('Editar ejercicio');
  const name = edit.getByRole('textbox', { name: 'Nombre' });
  await expect(name).toHaveValue(NAME);
  await name.fill('Face pull en polea alta');
  await edit.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(edit).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Cambios guardados');
  await expect(card(page, 'Face pull en polea alta')).toBeVisible();
  await expect(page.getByRole('heading', { name: NAME, exact: true })).toHaveCount(0);

  // Otro con el mismo nombre en distinto formato: error en línea y no se crea.
  await fab(page).click();
  const create = dialog(page);
  await create.getByRole('textbox', { name: 'Nombre' }).fill('FACE pull EN polea ALTA');
  await create.getByRole('button', { name: 'Crear ejercicio' }).click();
  await expect(create.getByText('Ya existe un ejercicio con ese nombre.')).toBeVisible();
  await expect(create.getByRole('textbox', { name: 'Nombre' })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(create).toBeVisible();
  expect(await mine(page)).toHaveLength(1);

  // Contra un ejercicio de la semilla, sin tildes.
  await create.getByRole('textbox', { name: 'Nombre' }).fill('jalon al pecho');
  await create.getByRole('button', { name: 'Crear ejercicio' }).click();
  await expect(create.getByText('Ya existe un ejercicio con ese nombre.')).toBeVisible();

  // Al corregir el nombre el error desaparece.
  await create.getByRole('textbox', { name: 'Nombre' }).fill('Face pull con banda');
  await expect(create.getByText('Ya existe un ejercicio con ese nombre.')).toHaveCount(0);
  await create.getByRole('button', { name: 'Cerrar' }).click();
  await expect(create).toHaveCount(0);
  await waitForCatalog(page, TOTAL + 1);

  // Borrar con confirmación: primero se cancela, luego se confirma.
  await page.getByRole('button', { name: 'Editar Face pull en polea alta' }).click();
  await dialog(page).getByRole('button', { name: 'Borrar ejercicio' }).click();
  const confirm = dialog(page);
  await expect(confirm).toHaveAccessibleName('¿Borrar «Face pull en polea alta»?');
  await confirm.getByRole('button', { name: 'Cancelar' }).click();
  await expect(dialog(page)).toHaveAccessibleName('Editar ejercicio');
  await expect(card(page, 'Face pull en polea alta')).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Borrar ejercicio' }).click();
  await dialog(page).getByRole('button', { name: 'Borrar', exact: true }).click();

  await expect(dialog(page)).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Ejercicio borrado');
  await waitForCatalog(page, TOTAL);
  await expect(page.getByRole('heading', { name: 'Face pull en polea alta' })).toHaveCount(0);
  await expect.poll(async () => (await mine(page)).length).toBe(0);

  // Sigue sin estar tras recargar.
  await page.reload();
  await waitForCatalog(page, TOTAL);
  await expect(page.getByRole('heading', { name: 'Face pull en polea alta' })).toHaveCount(0);
  expect(await mine(page)).toHaveLength(0);
});

test('el aviso de confirmación desaparece solo', async ({ page }) => {
  await createExercise(page, NAME);
  const status = page.getByRole('status');
  await expect(status).toHaveText('Ejercicio creado');
  // Aserción con reintentos: espera hasta que el aviso se retire (3 s en la app).
  await expect(status).toBeEmpty({ timeout: 6000 });
});

test('un ejercicio usado en el historial se archiva: sale del catálogo pero se conserva en la base', async ({
  page,
}) => {
  await createExercise(page, NAME);
  await waitForCatalog(page, TOTAL + 1);
  const [created] = await mine(page);
  expect(created?.name).toBe(NAME);
  await insertSession(page, created!.id);

  await page.getByRole('button', { name: `Editar ${NAME}` }).click();
  await dialog(page).getByRole('button', { name: 'Borrar ejercicio' }).click();
  await dialog(page).getByRole('button', { name: 'Borrar', exact: true }).click();

  await expect(dialog(page)).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText(
    'Ejercicio quitado del catálogo. Se conserva en tu historial.',
  );
  await waitForCatalog(page, TOTAL);
  await expect(page.getByRole('heading', { name: NAME })).toHaveCount(0);

  // Sigue en el store, archivado, y no vuelve al recargar.
  await expect
    .poll(async () => (await mine(page)).find((e) => e.id === created!.id)?.archivedAt)
    .toBeGreaterThan(0);
  await page.reload();
  await waitForCatalog(page, TOTAL);
  await expect(page.getByRole('heading', { name: NAME })).toHaveCount(0);
  const stored = (await mine(page)).find((e) => e.id === created!.id);
  expect(stored?.name).toBe(NAME);

  // Y el nombre queda libre para crear otro.
  await createExercise(page, NAME);
  await waitForCatalog(page, TOTAL + 1);
  await expect(card(page, NAME)).toBeVisible();
});

test.describe('hoja modal', () => {
  test('Escape cierra la hoja y el foco vuelve al botón de origen', async ({ page }) => {
    await fab(page).click();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page).getByRole('textbox', { name: 'Nombre' })).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(dialog(page)).toHaveCount(0);
    await expect(fab(page)).toBeFocused();
    expect(await mine(page)).toHaveLength(0);
  });

  test('pulsar el fondo cierra la hoja; pulsar dentro no', async ({ page }) => {
    await fab(page).click();
    await expect(dialog(page)).toBeVisible();

    await dialog(page).getByRole('heading', { name: 'Nuevo ejercicio' }).click();
    await expect(dialog(page)).toBeVisible();

    await page.getByTestId('sheet-backdrop').click({ position: { x: 10, y: 10 } });

    await expect(dialog(page)).toHaveCount(0);
    await expect(fab(page)).toBeFocused();
  });

  test('Tab y Shift+Tab no sacan el foco de la hoja', async ({ page }) => {
    await fab(page).click();
    await expect(dialog(page)).toBeVisible();

    const insideDialog = () =>
      page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null);

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await insideDialog(), `Tab nº ${i + 1}`).toBe(true);
    }
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await insideDialog(), `Shift+Tab nº ${i + 1}`).toBe(true);
    }
  });

  test('la hoja bloquea el scroll de la página y lo restaura al cerrar', async ({ page }) => {
    const overflow = () => page.evaluate(() => document.body.style.overflow);
    expect(await overflow()).toBe('');

    await fab(page).click();
    await expect(dialog(page)).toBeVisible();
    expect(await overflow()).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    expect(await overflow()).toBe('');
  });

  test('no desborda en horizontal y sus botones miden al menos 44px de alto', async ({ page }) => {
    await createExercise(page, NAME);
    await waitForCatalog(page, TOTAL + 1);

    async function check(buttons: string[]) {
      const sheet = dialog(page);
      await expect(sheet).toBeVisible();
      for (const label of buttons) {
        const box = await sheet.getByRole('button', { name: label, exact: true }).boundingBox();
        expect(box, label).not.toBeNull();
        expect(box!.height, label).toBeGreaterThanOrEqual(44);
        expect(box!.width, label).toBeGreaterThanOrEqual(44);
      }
      const metrics = await page.evaluate(() => {
        const panel = document.querySelector('[role="dialog"]')!.getBoundingClientRect();
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          left: panel.left,
          right: panel.right,
        };
      });
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
      expect(metrics.left).toBeGreaterThanOrEqual(0);
      expect(metrics.right).toBeLessThanOrEqual(metrics.innerWidth);
    }

    // Crear.
    await fab(page).click();
    await check(['Cerrar', 'Crear ejercicio']);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);

    // Editar y confirmación de borrado.
    await page.getByRole('button', { name: `Editar ${NAME}` }).click();
    await check(['Cerrar', 'Guardar cambios', 'Borrar ejercicio']);
    await dialog(page).getByRole('button', { name: 'Borrar ejercicio' }).click();
    await check(['Cerrar', 'Borrar', 'Cancelar']);

    // El botón de editar de la tarjeta también cumple.
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    const editBox = await page.getByRole('button', { name: `Editar ${NAME}` }).boundingBox();
    expect(editBox!.height).toBeGreaterThanOrEqual(44);
    expect(editBox!.width).toBeGreaterThanOrEqual(44);
  });
});

test('el botón flotante no tapa el texto de la última tarjeta al final de la lista', async ({
  page,
}) => {
  const lastCard = page.locator('main ul > li').last();
  await lastCard.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  // Esperamos a que el scroll llegue al final.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Math.ceil(window.scrollY + window.innerHeight) >=
          document.documentElement.scrollHeight - 1,
      ),
    )
    .toBe(true);

  const button = fab(page);
  await expect(button).toBeVisible();
  const cardBox = (await lastCard.boundingBox())!;
  const fabBox = (await button.boundingBox())!;

  // La última tarjeta queda entera por encima del botón flotante.
  expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(fabBox.y);
  // Y, en cualquier caso, el botón no solapa el texto de la tarjeta.
  const overlaps =
    fabBox.x < cardBox.x + cardBox.width &&
    fabBox.x + fabBox.width > cardBox.x &&
    fabBox.y < cardBox.y + cardBox.height &&
    fabBox.y + fabBox.height > cardBox.y;
  expect(overlaps).toBe(false);
});

import { expect, test, type Page } from '@playwright/test';

/** Crea una rutina con un día y un ejercicio (2 series) y vuelve a Hoy. */
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

async function startWorkout(page: Page) {
  await createRoutineWithOneDay(page);
  await page.getByRole('button', { name: 'Empezar entreno' }).click();
  await expect(page).toHaveURL(/\/entreno$/);
}

test('entreno completo: empezar, registrar series, descanso, terminar', async ({ page }) => {
  await startWorkout(page);
  await expect(page.getByRole('timer', { name: 'Tiempo de entreno' })).toBeVisible();

  await page.getByRole('button', { name: /^Aumentar peso de la serie 1/ }).click();
  await page.getByRole('button', { name: /^Completar serie 1 de/ }).click();

  const banner = page.getByRole('button', { name: 'Abrir temporizador de descanso' });
  await expect(banner).toBeVisible();
  await page.getByRole('button', { name: 'Saltar', exact: true }).click();
  await expect(banner).toBeHidden();

  await page.getByRole('button', { name: /^Completar serie 2 de/ }).click();
  await expect(banner).toBeVisible();
  await expect(page.getByText(/^2 \/ 3 series$/)).toBeVisible();
  await page.getByRole('button', { name: 'Saltar', exact: true }).click();

  await page.getByRole('button', { name: 'Terminar', exact: true }).click();
  await page.getByRole('button', { name: 'Terminar entreno' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Entreno guardado')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar' })).toHaveCount(0);
});

test('reanudación: recargar conserva la sesión y Hoy ofrece Continuar', async ({ page }) => {
  await startWorkout(page);
  await page.getByRole('button', { name: /^Completar serie 1 de/ }).click();
  await expect(page.getByRole('button', { name: /^Desmarcar serie 1 de/ })).toBeVisible();
  // Espera a que la serie llegue a IndexedDB antes de recargar.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            const open = indexedDB.open('gym-routine');
            open.onsuccess = () => {
              const db = open.result;
              const req = db.transaction('sessions').objectStore('sessions').getAll();
              req.onsuccess = () => {
                const done = (req.result as { sets: { completedAt?: number }[] }[]).flatMap((s) =>
                  s.sets.filter((x) => x.completedAt !== undefined),
                );
                db.close();
                resolve(done.length);
              };
            };
          }),
      ),
    )
    .toBe(1);

  await page.reload();
  await expect(page).toHaveURL(/\/entreno$/);
  await expect(page.getByRole('button', { name: /^Desmarcar serie 1 de/ })).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible();
});

test('descartar el entreno borra la sesión', async ({ page }) => {
  await startWorkout(page);
  await page.getByRole('button', { name: /^Completar serie 1 de/ }).click();
  await page.getByRole('button', { name: 'Terminar', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar entreno' }).click();
  await page.getByRole('button', { name: 'Descartar entreno' }).last().click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'Continuar' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Empezar entreno' })).toBeVisible();
  await page.goto('/entreno');
  await expect(page).toHaveURL(/\/$/);
});

import { expect, test, type Page } from '@playwright/test';
import { SEED_EXERCISES } from '../src/data/exercises';

/** Cuenta los ejercicios con la API nativa de IndexedDB: comprueba la base real, no el repositorio. */
async function countExercises(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const open = indexedDB.open('gym-routine');
        open.onerror = () => resolve(0);
        open.onsuccess = () => {
          const database = open.result;
          if (!database.objectStoreNames.contains('exercises')) {
            database.close();
            resolve(0);
            return;
          }
          const request = database.transaction('exercises').objectStore('exercises').count();
          request.onsuccess = () => {
            database.close();
            resolve(request.result);
          };
          request.onerror = () => {
            database.close();
            resolve(0);
          };
        };
      }),
  );
}

test('el primer arranque carga el catálogo y recargar no lo duplica', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => countExercises(page)).toBe(SEED_EXERCISES.length);

  await page.reload();
  await expect(page.getByRole('link', { name: /gym routine/i })).toBeVisible();
  await page.waitForTimeout(500);
  expect(await countExercises(page)).toBe(SEED_EXERCISES.length);
});

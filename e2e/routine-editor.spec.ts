import { expect, test } from '@playwright/test';

test('crear rutina, editarla, añadir días y recargar conserva los cambios', async ({ page }) => {
  await page.goto('/rutinas');
  await page.getByRole('button', { name: 'Nueva rutina' }).click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Nombre' }).fill('Mi PPL');
  await page.getByRole('button', { name: 'Crear rutina' }).click();

  await page.getByRole('link', { name: 'Editar Mi PPL' }).click();
  await expect(page.getByRole('heading', { name: 'Editar rutina' })).toBeVisible();

  await page.getByRole('button', { name: 'Añadir día de entreno' }).click();
  await page.getByRole('button', { name: 'Añadir día de entreno' }).click();
  await page.getByRole('button', { name: 'Añadir día de descanso activo' }).click();
  await page.getByRole('textbox', { name: 'Nombre del día 1' }).fill('Push A');
  await page.getByRole('textbox', { name: 'Nota del día 3' }).fill('Movilidad · 30 min');
  await page.getByRole('button', { name: 'Aumentar días por semana' }).click();
  await page.getByRole('button', { name: 'Bajar día 1' }).click();
  await page.getByRole('textbox', { name: 'Nombre de la rutina' }).fill('Mi PPL v2');
  await page.keyboard.press('Tab');
  // Guarda al salir del campo: esperamos a que llegue a IndexedDB antes de recargar.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<string[]>((resolve) => {
            const open = indexedDB.open('gym-routine');
            open.onsuccess = () => {
              const request = open.result.transaction('routines').objectStore('routines').getAll();
              request.onsuccess = () => {
                open.result.close();
                resolve((request.result as { name: string }[]).map((r) => r.name));
              };
            };
          }),
      ),
    )
    .toEqual(['Mi PPL v2']);

  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Nombre de la rutina' })).toHaveValue('Mi PPL v2');
  await expect(page.getByRole('textbox', { name: 'Nombre del día 1' })).toHaveValue('Día 2');
  await expect(page.getByRole('textbox', { name: 'Nombre del día 2' })).toHaveValue('Push A');
  await expect(page.getByRole('textbox', { name: 'Nota del día 3' })).toHaveValue(
    'Movilidad · 30 min',
  );
  await expect(page.getByText('4', { exact: true })).toBeVisible();
});

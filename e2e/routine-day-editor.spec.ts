import { expect, test } from '@playwright/test';

test('editor de día: añadir, configurar, reordenar y recargar conserva todo', async ({ page }) => {
  await page.goto('/rutinas');
  await page.getByRole('button', { name: 'Nueva rutina' }).click();
  await page.getByRole('dialog').getByRole('textbox', { name: 'Nombre' }).fill('Mi PPL');
  await page.getByRole('button', { name: 'Crear rutina' }).click();
  await page.getByRole('link', { name: 'Editar Mi PPL' }).click();
  await page.getByRole('button', { name: 'Añadir día de entreno' }).click();
  await page.getByRole('link', { name: /Editar ejercicios de Día 1/ }).click();
  await expect(page.getByRole('heading', { name: 'Día 1' })).toBeVisible();

  await page.getByRole('button', { name: /Añadir ejercicio desde catálogo/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('searchbox').fill('press banca con barra');
  await dialog
    .getByRole('button', { name: /^Añadir / })
    .first()
    .click();
  await dialog.getByRole('searchbox').fill('sentadilla');
  await dialog
    .getByRole('button', { name: /^Añadir / })
    .first()
    .click();
  await dialog.getByRole('button', { name: 'Cerrar' }).click();

  const items = page.getByRole('list', { name: 'Ejercicios del día' }).getByRole('heading');
  await expect(items).toHaveCount(2);
  const first = (await items.nth(0).innerText()).replace(/^\d+\s*/, '');
  const second = (await items.nth(1).innerText()).replace(/^\d+\s*/, '');

  await page.getByRole('button', { name: `Aumentar series de ${first}` }).click();
  await page.getByRole('button', { name: `Aumentar descanso de ${first}` }).click();
  // Reordenar por arrastre del asa (ratón).
  const handle = page.getByRole('button', { name: `Arrastrar ${first} para reordenar` });
  const target = page.getByRole('button', { name: `Arrastrar ${second} para reordenar` });
  const from = (await handle.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, from.y + 40, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2 + 40, { steps: 15 });
  await page.mouse.up();
  await expect(items.nth(0)).toContainText(second);

  await expect(page.getByText('2 ejercicios · 7 series')).toBeVisible();
  await page.reload();
  await expect(items.nth(0)).toContainText(second);
  await expect(items.nth(1)).toContainText(first);
  await expect(page.getByText('2 ejercicios · 7 series')).toBeVisible();
  await expect(page.getByText('1:45')).toBeVisible();
});

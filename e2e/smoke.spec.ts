import { expect, test } from '@playwright/test';

test('la app carga en móvil y se puede navegar entre pantallas', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /gym routine/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sin rutina activa' })).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Principal' });
  await nav.getByRole('link', { name: 'Ejercicios' }).click();
  await expect(page.getByRole('heading', { name: 'Catálogo de Ejercicios' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Ejercicios' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Catálogo de Ejercicios' })).toBeVisible();
});

test('los objetivos táctiles de la barra inferior miden al menos 44px', async ({ page }) => {
  await page.goto('/');
  const links = page.getByRole('navigation', { name: 'Principal' }).getByRole('link');
  for (let i = 0; i < (await links.count()); i++) {
    const box = await links.nth(i).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
});

import { expect, test } from '@playwright/test';

test('la app carga en móvil', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Gym Routine' })).toBeVisible();
});

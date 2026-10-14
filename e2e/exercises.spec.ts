import { expect, test } from '@playwright/test';
import { SEED_EXERCISES } from '../src/data/exercises';

const TOTAL = SEED_EXERCISES.length;
const CHEST = SEED_EXERCISES.filter((e) => e.muscleGroup === 'chest').length;

function countLabel(count: number): string {
  return count === 1 ? '1 ejercicio' : `${count} ejercicios`;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/ejercicios');
  await expect(page.getByRole('heading', { name: 'Catálogo de Ejercicios' })).toBeVisible();
  // El catálogo se carga al arrancar: esperamos a que se vea completo.
  await expect(page.getByText(countLabel(TOTAL), { exact: true })).toBeVisible();
});

test('buscar, filtrar por grupo y recuperar la lista con los botones de limpiar', async ({
  page,
}) => {
  const search = page.getByRole('searchbox', { name: 'Buscar ejercicio o músculo' });
  const cards = page.getByRole('heading', { level: 3 });
  const groups = page.getByRole('group', { name: 'Filtrar por grupo muscular' });

  await expect(cards).toHaveCount(TOTAL);

  // Búsqueda sin tildes.
  await search.fill('jalon');
  await expect(page.getByText('1 ejercicio', { exact: true })).toBeVisible();
  await expect(cards).toHaveText(['Jalón al pecho']);

  // Borrar búsqueda.
  await page.getByRole('button', { name: 'Borrar búsqueda' }).click();
  await expect(search).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Borrar búsqueda' })).toHaveCount(0);
  await expect(page.getByText(countLabel(TOTAL), { exact: true })).toBeVisible();

  // Filtro por grupo.
  const chest = groups.getByRole('button', { name: 'Pecho' });
  await chest.click();
  await expect(chest).toHaveAttribute('aria-pressed', 'true');
  await expect(groups.getByRole('button', { name: 'Todos' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.getByText(countLabel(CHEST), { exact: true })).toBeVisible();
  await expect(cards).toHaveCount(CHEST);

  // Grupo + búsqueda sin coincidencias.
  await search.fill('jalon');
  await expect(page.getByRole('heading', { name: 'Sin resultados' })).toBeVisible();
  await expect(page.getByText('0 ejercicios', { exact: true })).toBeVisible();

  // Limpiar filtros restaura todo.
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(search).toHaveValue('');
  await expect(groups.getByRole('button', { name: 'Todos' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('heading', { name: 'Sin resultados' })).toHaveCount(0);
  await expect(page.getByText(countLabel(TOTAL), { exact: true })).toBeVisible();
  await expect(cards).toHaveCount(TOTAL);
});

test('no hay chip de Cardio con el catálogo semilla', async ({ page }) => {
  const groups = page.getByRole('group', { name: 'Filtrar por grupo muscular' });
  await expect(groups.getByRole('button', { name: 'Pecho' })).toBeVisible();
  await expect(groups.getByRole('button', { name: 'Cardio' })).toHaveCount(0);
});

test('chips y botón de borrar miden al menos 44px y la página no desborda en horizontal', async ({
  page,
}) => {
  const chips = page.getByRole('group', { name: 'Filtrar por grupo muscular' }).getByRole('button');
  const chipCount = await chips.count();
  expect(chipCount).toBeGreaterThan(1);
  for (let i = 0; i < chipCount; i++) {
    const box = await chips.nth(i).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  await page.getByRole('searchbox', { name: 'Buscar ejercicio o músculo' }).fill('a');
  const clear = page.getByRole('button', { name: 'Borrar búsqueda' });
  await expect(clear).toBeVisible();
  const clearBox = await clear.boundingBox();
  expect(clearBox!.height).toBeGreaterThanOrEqual(44);
  expect(clearBox!.width).toBeGreaterThanOrEqual(44);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
});

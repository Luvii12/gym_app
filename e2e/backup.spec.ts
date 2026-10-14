import { expect, test, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

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

/** Registra un entreno de dos series de 20 kg x 8 (volumen 320 kg). */
async function logWorkout(page: Page) {
  await page.getByRole('button', { name: 'Empezar entreno' }).click();
  await expect(page).toHaveURL(/\/entreno$/);
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
}

async function expectWorkoutData(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Último entreno/ })).toContainText('320 kg');
  await page.goto('/progreso');
  await expect(page.getByText('Todavía no hay datos')).toHaveCount(0);
  const records = page.getByRole('region', { name: /Récords personales/ });
  const prCard = records.getByRole('listitem').first();
  await expect(prCard).toContainText('Press banca inclinado con barra');
  await expect(prCard).toContainText('25,33');
  await expect(prCard).toContainText('20 kg × 8');
  await page.goto('/progreso/historial');
  const list = page.getByRole('main').getByRole('listitem');
  await expect(list).toHaveCount(1);
  await expect(list.first()).toContainText('320 kg');
}

test('copia de seguridad: exportar, borrar, importar y recargar', async ({ page }, testInfo) => {
  await createRoutineWithOneDay(page);
  await logWorkout(page);

  await page.goto('/ajustes');
  await expect(page.getByText('1 entreno guardado en este dispositivo')).toBeVisible();

  // Exportar.
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia (JSON)' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^gym-routine-\d{4}-\d{2}-\d{2}\.json$/);
  const backupPath = testInfo.outputPath('backup.json');
  await download.saveAs(backupPath);
  const backup = JSON.parse(readFileSync(backupPath, 'utf8')) as {
    format: string;
    version: number;
    sessions: { sets: unknown[] }[];
    routines: { name: string }[];
  };
  expect(backup.format).toBe('gym-routine-backup');
  expect(backup.version).toBeGreaterThanOrEqual(1);
  expect(backup.sessions).toHaveLength(1);
  expect(backup.sessions[0]!.sets).toHaveLength(2);
  expect(backup.routines.map((r) => r.name)).toEqual(['Mi PPL']);

  // Borrar todo, con confirmación.
  await page.getByRole('button', { name: 'Borrar todos los datos' }).click();
  const clearDialog = page.getByRole('dialog');
  await expect(clearDialog).toContainText('1 entreno');
  await clearDialog.getByRole('button', { name: 'Borrar todo' }).click();
  await expect(page.getByText('Aún no hay entrenos')).toBeVisible();

  await page.goto('/');
  await expect(page.getByRole('link', { name: /Último entreno/ })).toHaveCount(0);
  await page.goto('/progreso');
  await expect(page.getByText('Todavía no hay datos')).toBeVisible();

  // Importar la copia exportada.
  await page.goto('/ajustes');
  await page.getByLabel('Archivo de copia de seguridad').setInputFiles(backupPath);
  const importDialog = page.getByRole('dialog');
  await expect(importDialog).toContainText('1 entreno');
  await expect(importDialog).toContainText('1 rutina');
  await importDialog.getByRole('button', { name: 'Importar y sustituir' }).click();
  await expect(page.getByText('1 entreno guardado en este dispositivo')).toBeVisible();

  await expectWorkoutData(page);

  // Recargar conserva todo.
  await page.reload();
  await expectWorkoutData(page);
  await page.goto('/ajustes');
  await expect(page.getByText('1 entreno guardado en este dispositivo')).toBeVisible();
});

test('copia de seguridad: un JSON inválido muestra el error y no cambia los datos', async ({
  page,
}, testInfo) => {
  await createRoutineWithOneDay(page);
  await logWorkout(page);
  await page.goto('/ajustes');
  await expect(page.getByText('1 entreno guardado en este dispositivo')).toBeVisible();

  const badPath = testInfo.outputPath('invalid.json');
  writeFileSync(badPath, JSON.stringify({ format: 'otra-cosa', version: 1 }));
  await page.getByLabel('Archivo de copia de seguridad').setInputFiles(badPath);

  await expect(page.getByRole('alert')).toContainText(
    'El archivo no es una copia de seguridad de Gym Routine.',
  );
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('1 entreno guardado en este dispositivo')).toBeVisible();
});

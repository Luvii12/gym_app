/** Suma `delta` a `value` sin deriva de coma flotante y lo mantiene dentro de [min, max]. */
export function stepValue(
  value: number,
  delta: number,
  { min = 0, max = Number.POSITIVE_INFINITY }: { min?: number; max?: number } = {},
): number {
  const next = Math.round((value + delta) * 100) / 100;
  return Math.min(max, Math.max(min, next));
}

/** Formato español: 82,5 · 12 · 3.265 (sin ceros sobrantes). */
export function formatNumber(value: number): string {
  return value.toLocaleString('es-ES', { maximumFractionDigits: 2 });
}

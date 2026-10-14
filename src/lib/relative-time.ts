/** "hoy" · "ayer" · "hace 5 días" · "hace 3 sem" · "hace 4 meses" a partir de días naturales. */
export function formatDaysAgo(days: number): string {
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 14) return `hace ${days} días`;
  if (days < 60) return `hace ${Math.floor(days / 7)} sem`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'hace 1 mes' : `hace ${months} meses`;
}

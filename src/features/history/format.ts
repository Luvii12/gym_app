/** "mié 14 oct" */
export function formatSessionDate(timestamp: number): string {
  return new Date(timestamp)
    .toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\./g, '');
}

/** "18:30" */
export function formatSessionTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/** "45 min" o "1 h 05 min" */
export function formatMinutes(ms: number): string {
  const total = Math.round(ms / 60000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
}

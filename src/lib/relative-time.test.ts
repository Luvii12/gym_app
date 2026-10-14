import { formatDaysAgo } from './relative-time';

describe('formatDaysAgo', () => {
  it.each([
    [0, 'hoy'],
    [1, 'ayer'],
    [2, 'hace 2 días'],
    [13, 'hace 13 días'],
    [14, 'hace 2 sem'],
    [59, 'hace 8 sem'],
    [60, 'hace 2 meses'],
    [365, 'hace 12 meses'],
  ])('%i días', (days, text) => {
    expect(formatDaysAgo(days)).toBe(text);
  });
});

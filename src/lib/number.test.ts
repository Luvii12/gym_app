import { formatNumber, stepValue } from './number';

describe('stepValue', () => {
  it('suma y resta sin deriva decimal', () => {
    expect(stepValue(82.5, 2.5)).toBe(85);
    expect(stepValue(0.1, 0.2)).toBe(0.3);
    expect(stepValue(10, -2.5)).toBe(7.5);
  });

  it('respeta mínimo y máximo', () => {
    expect(stepValue(1, -5, { min: 0 })).toBe(0);
    expect(stepValue(99, 5, { max: 100 })).toBe(100);
  });

  it('el mínimo por defecto es 0', () => {
    expect(stepValue(2, -10)).toBe(0);
  });
});

describe('formatNumber', () => {
  it('usa coma decimal y no añade ceros', () => {
    expect(formatNumber(82.5)).toBe('82,5');
    expect(formatNumber(10)).toBe('10');
    expect(formatNumber(12.25)).toBe('12,25');
  });
});

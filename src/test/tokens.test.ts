import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

function designColors(): Map<string, string> {
  const frontmatter = read('../../design/stitch/kinetic_volt/DESIGN.md').split('---')[1];
  const colors = frontmatter.split('\ntypography:')[0];
  return new Map(
    [...colors.matchAll(/^ {2}([a-z-]+): '(#[0-9a-fA-F]{6})'$/gm)].map((m) => [m[1], m[2]]),
  );
}

function themeColors(): Map<string, string> {
  const css = read('../index.css');
  return new Map(
    [...css.matchAll(/--color-([a-z-]+): (#[0-9a-fA-F]{6});/g)].map((m) => [m[1], m[2]]),
  );
}

describe('tokens de diseño', () => {
  it('cada color de DESIGN.md que usamos tiene el mismo valor en index.css', () => {
    const design = designColors();
    const theme = themeColors();
    const shared = [...theme.keys()].filter((name) => design.has(name));

    expect(shared.length).toBeGreaterThan(25);
    for (const name of shared) {
      expect(theme.get(name), name).toBe(design.get(name));
    }
  });

  it('los alias semánticos apuntan a los colores del prototipo', () => {
    const theme = themeColors();
    expect(theme.get('accent')).toBe(theme.get('primary-fixed'));
    expect(theme.get('on-accent')).toBe(theme.get('on-primary-fixed'));
    expect(theme.get('rest')).toBe(theme.get('secondary-container'));
    expect(theme.get('success')).toBe(theme.get('tertiary-fixed-dim'));
    expect(theme.get('danger')).toBe(theme.get('error'));
  });

  it('el texto secundario cumple contraste AA sobre el fondo y las tarjetas', () => {
    const theme = themeColors();
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const f = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a: string, b: string) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    for (const surface of ['background', 'surface-container', 'surface-container-high']) {
      expect(ratio(theme.get('muted')!, theme.get(surface)!), surface).toBeGreaterThanOrEqual(4.5);
    }
  });
});

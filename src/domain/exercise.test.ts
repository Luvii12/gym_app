import { EQUIPMENT, EQUIPMENT_LABELS, MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from './exercise';

describe('catálogo de grupos musculares y equipamiento', () => {
  it('cada grupo muscular tiene una etiqueta en español', () => {
    for (const group of MUSCLE_GROUPS) {
      expect(MUSCLE_GROUP_LABELS[group], group).toBeTruthy();
    }
    expect(Object.keys(MUSCLE_GROUP_LABELS).sort()).toEqual([...MUSCLE_GROUPS].sort());
  });

  it('cada equipamiento tiene una etiqueta en español', () => {
    for (const item of EQUIPMENT) {
      expect(EQUIPMENT_LABELS[item], item).toBeTruthy();
    }
    expect(Object.keys(EQUIPMENT_LABELS).sort()).toEqual([...EQUIPMENT].sort());
  });

  it('no hay valores repetidos', () => {
    expect(new Set(MUSCLE_GROUPS).size).toBe(MUSCLE_GROUPS.length);
    expect(new Set(EQUIPMENT).size).toBe(EQUIPMENT.length);
  });

  it('los grupos siguen los filtros del prototipo', () => {
    expect(MUSCLE_GROUP_LABELS.chest).toBe('Pecho');
    expect(MUSCLE_GROUP_LABELS.back).toBe('Espalda');
    expect(MUSCLE_GROUP_LABELS.legs).toBe('Piernas');
    expect(MUSCLE_GROUP_LABELS.shoulders).toBe('Hombros');
  });
});

import { filterExercises, groupsWithExercises, normalizeText } from './exercise-filter';
import type { Exercise } from './exercise';

const ex = (overrides: Partial<Exercise> & Pick<Exercise, 'id' | 'name'>): Exercise => ({
  muscleGroup: 'chest',
  equipment: 'barbell',
  isCustom: false,
  ...overrides,
});

const catalog: Exercise[] = [
  ex({
    id: 'bench',
    name: 'Press banca plano con barra',
    muscles: 'Pecho mayor, tríceps, deltoides anterior',
  }),
  ex({
    id: 'fly',
    name: 'Aperturas con mancuernas',
    equipment: 'dumbbell',
    muscles: 'Pecho mayor',
  }),
  ex({
    id: 'pulldown',
    name: 'Jalón al pecho',
    muscleGroup: 'back',
    equipment: 'cable',
    muscles: 'Dorsal ancho, bíceps',
  }),
  ex({
    id: 'squat',
    name: 'Sentadilla trasera con barra',
    muscleGroup: 'legs',
    muscles: 'Cuádriceps, glúteos',
  }),
  ex({ id: 'mine', name: 'Mi ejercicio', muscleGroup: 'core', equipment: 'other', isCustom: true }),
];

const ids = (list: Exercise[]) => list.map((e) => e.id);

describe('normalizeText', () => {
  it('quita tildes y mayúsculas y recorta espacios', () => {
    expect(normalizeText('  Jalón AL Pecho ')).toBe('jalon al pecho');
    expect(normalizeText('Tríceps')).toBe('triceps');
  });
});

describe('filterExercises', () => {
  it('sin filtros devuelve todo en el mismo orden', () => {
    expect(ids(filterExercises(catalog, {}))).toEqual([
      'bench',
      'fly',
      'pulldown',
      'squat',
      'mine',
    ]);
  });

  it('una búsqueda vacía o de solo espacios no filtra', () => {
    expect(filterExercises(catalog, { query: '   ' })).toHaveLength(catalog.length);
  });

  it('busca en el nombre sin distinguir tildes ni mayúsculas', () => {
    expect(ids(filterExercises(catalog, { query: 'JALON' }))).toEqual(['pulldown']);
  });

  it('busca también en los músculos trabajados', () => {
    expect(ids(filterExercises(catalog, { query: 'triceps' }))).toEqual(['bench']);
    expect(ids(filterExercises(catalog, { query: 'dorsal' }))).toEqual(['pulldown']);
  });

  it('busca también en el equipamiento', () => {
    expect(ids(filterExercises(catalog, { query: 'mancuernas' }))).toEqual(['fly']);
    expect(ids(filterExercises(catalog, { query: 'polea' }))).toEqual(['pulldown']);
  });

  it('todas las palabras de la búsqueda tienen que aparecer', () => {
    expect(ids(filterExercises(catalog, { query: 'press barra' }))).toEqual(['bench']);
    expect(filterExercises(catalog, { query: 'press sentadilla' })).toEqual([]);
  });

  it('filtra por grupo muscular', () => {
    expect(ids(filterExercises(catalog, { group: 'chest' }))).toEqual(['bench', 'fly']);
    expect(ids(filterExercises(catalog, { group: 'core' }))).toEqual(['mine']);
  });

  it('combina grupo y búsqueda', () => {
    expect(ids(filterExercises(catalog, { group: 'chest', query: 'barra' }))).toEqual(['bench']);
    expect(filterExercises(catalog, { group: 'back', query: 'barra' })).toEqual([]);
  });

  it('un grupo nulo significa todos', () => {
    expect(filterExercises(catalog, { group: null })).toHaveLength(catalog.length);
  });

  it('no modifica la lista original', () => {
    const copy = [...catalog];
    filterExercises(catalog, { group: 'chest' });
    expect(catalog).toEqual(copy);
  });
});

describe('groupsWithExercises', () => {
  it('devuelve solo los grupos con ejercicios, en el orden del catálogo de grupos', () => {
    expect(groupsWithExercises(catalog)).toEqual(['chest', 'back', 'legs', 'core']);
  });

  it('devuelve vacío si no hay ejercicios', () => {
    expect(groupsWithExercises([])).toEqual([]);
  });
});

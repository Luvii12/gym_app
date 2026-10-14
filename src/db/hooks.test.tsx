import { act, renderHook, waitFor } from '@testing-library/react';
import { db } from './database';
import { exerciseRepository } from './exercises';
import { useActiveRoutine, useExercises, useRoutine, useRoutines } from './hooks';
import { routineRepository } from './routines';

beforeEach(async () => {
  await db.exercises.clear();
});

describe('useExercises', () => {
  it('empieza sin datos y entrega la lista cuando la base responde', async () => {
    await exerciseRepository.create({
      name: 'Face pull',
      muscleGroup: 'shoulders',
      equipment: 'cable',
    });
    const { result } = renderHook(() => useExercises());

    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current?.[0].name).toBe('Face pull');
  });

  it('devuelve una lista vacía (no undefined) cuando la base está vacía', async () => {
    const { result } = renderHook(() => useExercises());
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it('se actualiza solo cuando cambia la base', async () => {
    const { result } = renderHook(() => useExercises());
    await waitFor(() => expect(result.current).toEqual([]));

    await act(async () => {
      await exerciseRepository.create({
        name: 'Curl martillo',
        muscleGroup: 'arms',
        equipment: 'dumbbell',
      });
    });
    await waitFor(() => expect(result.current).toHaveLength(1));
  });

  it('mantiene el orden por nombre', async () => {
    await exerciseRepository.create({ name: 'Remo', muscleGroup: 'back', equipment: 'barbell' });
    await exerciseRepository.create({
      name: 'Aperturas',
      muscleGroup: 'chest',
      equipment: 'dumbbell',
    });
    const { result } = renderHook(() => useExercises());

    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(result.current?.map((e) => e.name)).toEqual(['Aperturas', 'Remo']);
  });
});

describe('useRoutines y useActiveRoutine', () => {
  beforeEach(async () => {
    await db.routines.clear();
    await db.settings.clear();
  });

  it('entregan las rutinas y la activa, y se actualizan solos', async () => {
    const { result } = renderHook(() => ({ all: useRoutines(), active: useActiveRoutine() }));
    await waitFor(() => expect(result.current).toEqual({ all: [], active: null }));

    let id = '';
    await act(async () => {
      id = (await routineRepository.create({ name: 'PPL' })).id;
    });
    await waitFor(() => expect(result.current.all).toHaveLength(1));
    await waitFor(() => expect(result.current.active?.id).toBe(id));
  });
});

describe('useRoutine', () => {
  beforeEach(async () => {
    await db.routines.clear();
    await db.settings.clear();
  });

  it('entrega la rutina, null si no existe, y se actualiza solo', async () => {
    const created = await routineRepository.create({ name: 'PPL' });
    const { result } = renderHook(() => ({
      found: useRoutine(created.id),
      missing: useRoutine('no-existe'),
    }));
    expect(result.current.found).toBeUndefined();
    await waitFor(() => expect(result.current.found?.name).toBe('PPL'));
    expect(result.current.missing).toBeNull();

    await act(async () => {
      await routineRepository.update(created.id, { name: 'Torso' });
    });
    await waitFor(() => expect(result.current.found?.name).toBe('Torso'));
  });
});

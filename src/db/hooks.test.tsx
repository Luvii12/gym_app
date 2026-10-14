import { act, renderHook, waitFor } from '@testing-library/react';
import { db } from './database';
import { exerciseRepository } from './exercises';
import { useExercises } from './hooks';

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

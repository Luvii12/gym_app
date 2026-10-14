import { useLiveQuery } from 'dexie-react-hooks';
import type { Exercise } from '../domain';
import { exerciseRepository } from './exercises';

/** Ejercicios ordenados por nombre. `undefined` solo mientras responde la base por primera vez. */
export function useExercises(): Exercise[] | undefined {
  return useLiveQuery(() => exerciseRepository.list(), []);
}

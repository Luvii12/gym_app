import { SEED_EXERCISES } from '../data/exercises';
import { exerciseRepository, type ExerciseRepository } from './exercises';

/** Carga el catálogo de ejercicios en cada arranque. Es idempotente y barata (≈70 lecturas). */
export function seedCatalog(repository: ExerciseRepository = exerciseRepository) {
  return repository.seed([...SEED_EXERCISES]);
}

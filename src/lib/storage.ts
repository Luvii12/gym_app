/** Estado del almacenamiento: `unsupported` si el navegador no ofrece la API. */
export type PersistenceState = 'persisted' | 'best-effort' | 'unsupported';

type StorageLike = Pick<StorageManager, 'persisted' | 'persist'> | undefined;

const defaultStorage = (): StorageLike =>
  typeof navigator === 'undefined' ? undefined : navigator.storage;

/** ¿El navegador ha prometido no borrar los datos sin avisar? */
export async function persistenceState(
  storage: StorageLike = defaultStorage(),
): Promise<PersistenceState> {
  if (!storage?.persisted) return 'unsupported';
  try {
    return (await storage.persisted()) ? 'persisted' : 'best-effort';
  } catch {
    return 'unsupported';
  }
}

/**
 * Pide al navegador que no borre los datos al faltar espacio. Nunca lanza: si no hay API o se
 * rechaza, la app sigue funcionando con el almacenamiento normal.
 */
export async function requestPersistence(
  storage: StorageLike = defaultStorage(),
): Promise<PersistenceState> {
  if (!storage?.persist) return 'unsupported';
  try {
    if (await storage.persisted()) return 'persisted';
    return (await storage.persist()) ? 'persisted' : 'best-effort';
  } catch {
    return 'unsupported';
  }
}

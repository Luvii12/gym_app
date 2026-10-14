import { buildBackup, isSessionActive, type Backup } from '../domain';
import { db, type GymDatabase } from './database';

export function createBackupRepository(database: GymDatabase) {
  /** Quita todo lo del usuario; el catálogo semilla se queda (se recarga solo en cada arranque). */
  async function wipe() {
    await database.routines.clear();
    await database.sessions.clear();
    await database.settings.clear();
    await database.exercises.filter((e) => e.isCustom).delete();
  }

  const tables = [
    database.exercises,
    database.routines,
    database.sessions,
    database.settings,
  ] as const;

  return {
    async export(now = Date.now()): Promise<Backup> {
      return database.transaction('r', tables, async () =>
        buildBackup(
          {
            exercises: await database.exercises.toArray(),
            routines: await database.routines.toArray(),
            sessions: await database.sessions.toArray(),
            settings: await database.settings.toArray(),
          },
          now,
        ),
      );
    },

    /** Sustituye todos los datos por los de la copia, en una sola transacción (todo o nada). */
    import(backup: Backup): Promise<void> {
      return database.transaction('rw', tables, async () => {
        await wipe();
        await database.exercises.bulkPut(backup.exercises);
        await database.routines.bulkPut(backup.routines);
        await database.sessions.bulkPut(backup.sessions);
        await database.settings.bulkPut(backup.settings);
      });
    },

    clearAll(): Promise<void> {
      return database.transaction('rw', tables, wipe);
    },

    /** Entrenos terminados guardados en el dispositivo. */
    async countWorkouts(): Promise<number> {
      const all = await database.sessions.toArray();
      return all.filter((s) => !isSessionActive(s)).length;
    },
  };
}

export type BackupRepository = ReturnType<typeof createBackupRepository>;

export const backupRepository = createBackupRepository(db);

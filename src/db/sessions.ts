import { isSessionActive, type WorkoutSession } from '../domain';
import { db, type GymDatabase } from './database';
import { RepositoryError } from './errors';

export function createSessionRepository(database: GymDatabase) {
  const table = database.sessions;

  return {
    /** Sesión en curso (como mucho una), o `undefined`. */
    async getActive(): Promise<WorkoutSession | undefined> {
      const all = await table.orderBy('startedAt').reverse().toArray();
      return all.find(isSessionActive);
    },

    get(id: string): Promise<WorkoutSession | undefined> {
      return table.get(id);
    },

    /** Sesiones terminadas, de la más reciente a la más antigua. */
    async listFinished(): Promise<WorkoutSession[]> {
      const all = await table.orderBy('startedAt').reverse().toArray();
      return all.filter((session) => !isSessionActive(session));
    },

    /**
     * Guarda la sesión tal cual (alta o cambio). Si empieza una en curso mientras ya hay otra,
     * se rechaza: así no se pierde por error un entreno a medias.
     */
    save(session: WorkoutSession): Promise<WorkoutSession> {
      return database.transaction('rw', table, async () => {
        if (isSessionActive(session)) {
          const existing = await table.toArray();
          const other = existing.find((s) => isSessionActive(s) && s.id !== session.id);
          if (other) throw new RepositoryError('duplicate', 'Ya hay un entreno en curso');
        }
        await table.put(session);
        return session;
      });
    },

    async remove(id: string): Promise<void> {
      await table.delete(id);
    },
  };
}

export type SessionRepository = ReturnType<typeof createSessionRepository>;

export const sessionRepository = createSessionRepository(db);

import { persistenceState, requestPersistence } from './storage';

const fake = (persisted: boolean, grants: boolean) => ({
  persisted: vi.fn().mockResolvedValue(persisted),
  persist: vi.fn().mockResolvedValue(grants),
});

describe('requestPersistence', () => {
  it('sin API del navegador no hace nada', async () => {
    expect(await requestPersistence(undefined)).toBe('unsupported');
  });

  it('si ya era persistente no vuelve a pedirlo', async () => {
    const storage = fake(true, true);
    expect(await requestPersistence(storage)).toBe('persisted');
    expect(storage.persist).not.toHaveBeenCalled();
  });

  it('lo pide y devuelve el resultado', async () => {
    expect(await requestPersistence(fake(false, true))).toBe('persisted');
    expect(await requestPersistence(fake(false, false))).toBe('best-effort');
  });

  it('si el navegador falla no lanza', async () => {
    const storage = { persisted: vi.fn().mockRejectedValue(new Error('x')), persist: vi.fn() };
    expect(await requestPersistence(storage)).toBe('unsupported');
  });
});

describe('persistenceState', () => {
  it('lee el estado sin pedir nada', async () => {
    const storage = fake(false, true);
    expect(await persistenceState(storage)).toBe('best-effort');
    expect(storage.persist).not.toHaveBeenCalled();
    expect(await persistenceState(undefined)).toBe('unsupported');
  });
});

export type RepositoryErrorCode = 'not-found' | 'forbidden' | 'invalid';

/** Error esperable de un repositorio: la UI decide qué mensaje enseñar según `code`. */
export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
  }
}

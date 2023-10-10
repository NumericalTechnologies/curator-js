export const LockErrorCodes = {
  UNEXPECTED_ERROR: 10000000,
  OPERATION_TIMED_OUT: 10000001,
  NOT_CONNECTED: 10000002,
} as const;

export class LockError extends Error {
  constructor(public readonly code: typeof LockErrorCodes[keyof typeof LockErrorCodes], message?: string) {
    super(message);
  }
}

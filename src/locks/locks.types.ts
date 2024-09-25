import { LockError } from "../errors/lock-error";

export interface AcquireResponse {
  acquired: boolean;
  error: LockError | null;
}

export type TryAcquireResponse = AcquireResponse;

export interface ReleaseResponse {
  released: boolean;
  error: LockError | null;
}

export interface IsTypeLockedResponse {
  locked: boolean;
  error: LockError | null;
}

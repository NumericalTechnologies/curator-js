/// <reference types="node" />
import { NtCuratorFramework } from "../nt-curator-framework";
import { LockError } from "../errors/lock-error";
interface WriteLockAcquireResponse {
    acquired: boolean;
    error: LockError | null;
}
interface WriteLockReleaseResponse {
    released: boolean;
    error: LockError | null;
}
export declare class WriteLock {
    nodeAbsolutePath: string;
    lockAbsolutePath: string;
    private ntCuratorFramework;
    private pathUtility;
    constructor(ntCuratorFramework: NtCuratorFramework, path: string);
    createLockPath(path: string): string;
    acquire(options?: {
        data?: Buffer;
        timeout?: number;
    }): Promise<WriteLockAcquireResponse>;
    tryAcquire(options?: {
        data?: Buffer;
    }): Promise<WriteLockAcquireResponse>;
    release(): Promise<WriteLockReleaseResponse>;
}
export {};

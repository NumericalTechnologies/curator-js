/// <reference types="node" />
import { NtCuratorFramework } from "../nt-curator-framework";
import { LockError } from "../errors/lock-error";
interface ReadLockAcquireResponse {
    acquired: boolean;
    error: LockError | null;
}
interface ReadLockReleaseResponse {
    released: boolean;
    error: LockError | null;
}
export declare class ReadLock {
    nodeAbsolutePath: string;
    lockAbsolutePath: string;
    private ntCuratorFramework;
    private pathUtility;
    constructor(ntCuratorFramework: NtCuratorFramework, path: string);
    createLockPath(path: string): string;
    acquire(options?: {
        data?: Buffer;
        timeout?: number;
    }): Promise<ReadLockAcquireResponse>;
    tryAcquire(options?: {
        data?: Buffer;
    }): Promise<ReadLockAcquireResponse>;
    release(): Promise<ReadLockReleaseResponse>;
}
export {};

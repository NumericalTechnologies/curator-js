/// <reference types="node" />
import { NtCurator } from "../nt-curator";
import { AcquireResponse, IsTypeLockedResponse, ReleaseResponse, TryAcquireResponse } from "./locks.types";
export declare class ReadLock {
    nodeAbsolutePath: string;
    lockAbsolutePath: string;
    private ntCurator;
    private pathUtility;
    constructor(ntCurator: NtCurator, path: string);
    createLockPath(path: string): string;
    acquire(options?: {
        data?: Buffer;
        timeout?: number;
    }): Promise<AcquireResponse>;
    tryAcquire(options?: {
        data?: Buffer;
    }): Promise<TryAcquireResponse>;
    release(): Promise<ReleaseResponse>;
    isTypeLocked(): Promise<IsTypeLockedResponse>;
}

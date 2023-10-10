import { NtCuratorFramework } from "./nt-curator-framework";
export declare class PathUtility {
    private ntCuratorFramework;
    constructor(ntCuratorFramework: NtCuratorFramework);
    normalizePath(...path: string[]): string;
    ensurePathExists(normalizedPath: string): Promise<void>;
    doesLowerSequenceNumberChildPathExist(pathWithSequenceNumber: string, children: string[]): boolean;
    getNextLowestSequenceNumberChildPath(pathWithSequenceNumber: string, children: string[]): string;
}

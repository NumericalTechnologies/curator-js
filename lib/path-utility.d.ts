import { NtCurator } from "./nt-curator";
export declare class PathUtility {
    private ntCurator;
    constructor(ntCurator: NtCurator);
    normalizePath(...path: string[]): string;
    ensurePathExists(normalizedPath: string): Promise<void>;
    doesLowerSequenceNumberChildPathExist(pathWithSequenceNumber: string, children: string[]): boolean;
    getNextLowestSequenceNumberChildPath(pathWithSequenceNumber: string, children: string[]): string;
}

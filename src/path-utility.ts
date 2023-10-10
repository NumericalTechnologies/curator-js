import { join } from "path";
import { CreateMode, Exception } from "node-zookeeper-client";
import { NtCuratorFramework } from "./nt-curator-framework";
import { getNodeSequenceNumber } from "./helpers/validation";
import { parseZooKeeperError } from "./helpers/error";

export class PathUtility {
  constructor(private ntCuratorFramework: NtCuratorFramework) {}

  public normalizePath(...path: string[]) {
    return join(...path);
  }

  /**
   * This method ensures that multi-level path are recursively checked for existence.
   * Any part of the path that is not existent will be created accordingly.
   * @param normalizedPath Must be a string that is normalized, starting with "/"
   */
  public async ensurePathExists(normalizedPath: string) {
    const client = this.ntCuratorFramework.getClient();
    const pathsToCreate = normalizedPath
      .split("/")
      .filter((path) => !!path)
      .map((_, index, array) => `/${array.slice(0, index + 1).join("/")}`);

    /*
      For creating path /a/b/c/d, the create order will be:
      1. /a
      2. /a/b
      3. /a/b/c
      2. /a/b/c/d
    */
    for (let i = 0; i < pathsToCreate.length; i += 1) {
      try {
        await new Promise((res, rej) => {
          client.create(
            pathsToCreate[i],
            Buffer.from(""),
            CreateMode.PERSISTENT,
            (error, path) => {
              if (error) return rej(error);
              res(path);
            },
          );
        });
      } catch (err) {
        const { code } = parseZooKeeperError(err);
        if (code === Exception.NODE_EXISTS) continue;
      }
    }
  }

  public doesLowerSequenceNumberChildPathExist(pathWithSequenceNumber: string, children: string[]): boolean {
    const pathSequenceNumber = getNodeSequenceNumber(pathWithSequenceNumber);
    if (Number.isNaN(pathSequenceNumber)) return false;

    return !!(
      children.find((child) => {
        const childSequenceNumber = getNodeSequenceNumber(child);
        if (Number.isNaN(childSequenceNumber)) return false;
        return childSequenceNumber < pathSequenceNumber;
      })
    );
  }

  public getNextLowestSequenceNumberChildPath(pathWithSequenceNumber: string, children: string[]) {
    let pathSequenceNumber = getNodeSequenceNumber(pathWithSequenceNumber);
    if (Number.isNaN(pathSequenceNumber)) {
      pathSequenceNumber = Number.MIN_SAFE_INTEGER;
    }

    let largestSequenceNumberChildPath = "";
    let largestSequenceNumber = Number.MIN_SAFE_INTEGER;
    for (let i = 0; i < children.length; i += 1) {
      const childPath = children[i];
      const childSequenceNumber = getNodeSequenceNumber(childPath);
      if (
        Number.isNaN(childSequenceNumber)
        || childSequenceNumber < largestSequenceNumber
        || childSequenceNumber >= pathSequenceNumber
      ) continue;

      largestSequenceNumber = childSequenceNumber;
      largestSequenceNumberChildPath = childPath;
    }

    return largestSequenceNumberChildPath;
  }
}

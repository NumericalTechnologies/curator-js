import {
  CreateMode, Exception, Event, State,
} from "node-zookeeper-client";
import { WRITE_LOCK_PATH_NAME } from "../constants";
import { parseZooKeeperError } from "../helpers/error";
import { NtCuratorFramework } from "../nt-curator-framework";
import { PathUtility } from "../path-utility";
import { LockError, LockErrorCodes } from "../errors/lock-error";

interface WriteLockAcquireResponse {
  acquired: boolean;
  error: LockError | null;
}
interface WriteLockReleaseResponse {
  released: boolean;
  error: LockError | null;
}

export class WriteLock {
  public nodeAbsolutePath: string;

  public lockAbsolutePath: string;

  private ntCuratorFramework: NtCuratorFramework;

  private pathUtility: PathUtility;

  constructor(ntCuratorFramework: NtCuratorFramework, path: string) {
    this.ntCuratorFramework = ntCuratorFramework;
    this.pathUtility = new PathUtility(ntCuratorFramework);
    this.nodeAbsolutePath = this.pathUtility.normalizePath(path);
  }

  public createLockPath(path: string) {
    return this.pathUtility.normalizePath(path, WRITE_LOCK_PATH_NAME);
  }

  /**
   * Tries to acquire the lock, this will wait for the lock to be eligible for acquiring, and will therefore
   * block your function, please ensure that this is the intended behavior.
   *
   * The algorithm is as follows:
   *
   * 1. Call create( ) to create a node with pathname "_locknode_/write-". This is the lock node spoken of later in the protocol. Make sure to set both sequence and ephemeral flags.
   * 2. Call getChildren( ) on the lock node without setting the watch flag - this is important, as it avoids the herd effect.
   * 3. If there are no children with a lower sequence number than the node created in step 1, the client has the lock and the client exits the protocol.
   * 4. Call exists( ), with watch flag set, on the node with the pathname that has the next lowest sequence number.
   * 5. If exists( ) returns false, goto step 2. Otherwise, wait for a notification for the pathname from the previous step before going to step 2.
   *
   * `timeout` in `options` defaults to 1000 milliseconds.
   *
   * @see https://zookeeper.apache.org/doc/r3.1.2/recipes.html#Shared+Locks
   * @param options An object containing an optional `data` to append to the lock node and `timeout` that races against the actual operation.
   * @returns An object with `released` to represent whether the lock is released, and `error` (if any).
   * @throws {LockError}
   */
  public async acquire(options?: { data?: Buffer; timeout?: number; }): Promise<WriteLockAcquireResponse> {
    const { data = Buffer.from(""), timeout = 1000 } = options ?? {};

    const client = this.ntCuratorFramework.getClient();
    let createdPath = "";
    let timedOut = false;
    const enforceTimeout = async () => new Promise<WriteLockAcquireResponse>((res) => {
      setTimeout(() => {
        timedOut = true;
        res({ acquired: false, error: new LockError(LockErrorCodes.OPERATION_TIMED_OUT, `Acquiring the write lock timed out after ${timeout}ms.`) });
      }, timeout);
    });

    const enforceTimeoutPromise = enforceTimeout();
    const acquireLock = async () => {
      try {
        if (client.getState().code !== State.SYNC_CONNECTED.code) {
          return { acquired: false, error: new LockError(LockErrorCodes.NOT_CONNECTED, "Failed to acquire the write lock because of connection issues.") };
        }

        await this.pathUtility.ensurePathExists(this.nodeAbsolutePath);

        createdPath = await new Promise((res, rej) => {
          client.create(
            this.createLockPath(this.nodeAbsolutePath),
            data,
            CreateMode.EPHEMERAL_SEQUENTIAL,
            (error, path) => {
              if (error) return rej(error);
              res(path);
            },
          );
        });

        while (true) {
          const children: string[] = await new Promise((res, rej) => {
            client.getChildren(this.nodeAbsolutePath, (error, children) => {
              if (error) return rej(error);
              res(children);
            });
          });

          const doesLowerSequenceNumberChildPathExist = this.pathUtility.doesLowerSequenceNumberChildPathExist(createdPath, children);
          if (!doesLowerSequenceNumberChildPathExist) {
            this.lockAbsolutePath = createdPath;
            return { acquired: true, error: null };
          }

          const nextLowestSequenceNumberChildPath = this.pathUtility.getNextLowestSequenceNumberChildPath(createdPath, children);

          if (!nextLowestSequenceNumberChildPath) {
            this.lockAbsolutePath = createdPath;
            return { acquired: true, error: null };
          }

          await Promise.race([
            enforceTimeoutPromise,
            new Promise((res, rej) => {
              client.exists(
                this.pathUtility.normalizePath(this.nodeAbsolutePath, nextLowestSequenceNumberChildPath),
                (event) => {
                  if (event.type !== Event.NODE_DELETED) return;
                  res(null);
                },
                (error, stat) => {
                  if (error) return rej(error);
                  if (!stat) return res(null);
                },
              );
            }),
          ]);

          if (timedOut) return { acquired: false, error: new LockError(LockErrorCodes.OPERATION_TIMED_OUT, `Acquiring the write lock timed out after ${timeout}ms.`) };
        }
      } catch (err: unknown) {
        return { acquired: false, error: new LockError(LockErrorCodes.UNEXPECTED_ERROR, "An unexpected error occurred while trying to acquire the write lock.") };
      } finally {
        if (timedOut && createdPath) {
          await new Promise((res, rej) => {
            client.remove(createdPath, 0, (error) => {
              if (error) return rej(error);
              res(null);
            });
          });
        }
      }
    };

    return Promise.race(
      [
        enforceTimeoutPromise,
        acquireLock(),
      ],
    );
  }

  /**
   * Tries to acquire the lock, if there's any read lock or write lock created earlier,
   * it will immediately return false. It does not wait for the lock to be eligible for acquiring.
   *
   * @param options An object containing an optional `data` to append to the lock node.
   * @returns An object with `released` to represent whether the lock is released, and `error` (if any).
   * @throws {LockError}
   */
  public async tryAcquire(options?: { data?: Buffer; }): Promise<WriteLockAcquireResponse> {
    const { data = Buffer.from("") } = options ?? {};

    try {
      const client = this.ntCuratorFramework.getClient();
      if (client.getState().code !== State.SYNC_CONNECTED.code) {
        return { acquired: false, error: new LockError(LockErrorCodes.NOT_CONNECTED, "Failed to acquire the write lock because of connection issues.") };
      }
      await this.pathUtility.ensurePathExists(this.nodeAbsolutePath);

      // This will be in the form of /_locknode_/write-xxxxxxxxxx
      const createdPath: string = await new Promise((res, rej) => {
        client.create(
          this.createLockPath(this.nodeAbsolutePath),
          data,
          CreateMode.EPHEMERAL_SEQUENTIAL,
          (error, path) => {
            if (error) return rej(error);
            res(path);
          },
        );
      });

      const children: string[] = await new Promise((res, rej) => {
        client.getChildren(this.nodeAbsolutePath, (error, children) => {
          if (error) return rej(error);
          res(children);
        });
      });

      const doesLowerSequenceNumberChildPathExist = this.pathUtility.doesLowerSequenceNumberChildPathExist(createdPath, children);
      if (!doesLowerSequenceNumberChildPathExist) {
        this.lockAbsolutePath = createdPath;
        return { acquired: true, error: null };
      }

      await new Promise((res, rej) => {
        client.remove(createdPath, 0, (error) => {
          if (error) return rej(error);
          res(null);
        });
      });
      return { acquired: false, error: null };
    } catch (err: unknown) {
      return { acquired: false, error: new LockError(LockErrorCodes.UNEXPECTED_ERROR, "An unexpected error occurred while trying to acquire the write lock.") };
    }
  }

  /**
   * Releases the lock, this is a soft release whereby if it's called on a path
   * that doesn't exist, it will still return true, while all other errors raised
   * will cause it to return false.
   *
   * @returns An object with `released` to represent whether the lock is released, and `error` (if any).
   * @throws {LockError}
   */
  public async release(): Promise<WriteLockReleaseResponse> {
    try {
      const client = this.ntCuratorFramework.getClient();
      if (client.getState().code !== State.SYNC_CONNECTED.code) {
        return { released: false, error: new LockError(LockErrorCodes.NOT_CONNECTED, "Failed to release the write lock because of connection issues.") };
      }
      try {
        await new Promise((res, rej) => {
          client.remove(this.lockAbsolutePath, 0, (error) => {
            if (error) return rej(error);
            res(null);
          });
        });
      } catch (err) {
        const { code } = parseZooKeeperError(err);
        if (code !== Exception.NO_NODE) throw err;
      }

      this.lockAbsolutePath = "";

      return { released: true, error: null };
    } catch (err: unknown) {
      return { released: false, error: new LockError(LockErrorCodes.UNEXPECTED_ERROR, "An unexpected error occurred while trying to release the write lock.") };
    }
  }
}

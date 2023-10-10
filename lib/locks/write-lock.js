"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WriteLock = void 0;
const node_zookeeper_client_1 = require("node-zookeeper-client");
const constants_1 = require("../constants");
const error_1 = require("../helpers/error");
const path_utility_1 = require("../path-utility");
const lock_error_1 = require("../errors/lock-error");
class WriteLock {
    constructor(ntCuratorFramework, path) {
        this.ntCuratorFramework = ntCuratorFramework;
        this.pathUtility = new path_utility_1.PathUtility(ntCuratorFramework);
        this.nodeAbsolutePath = this.pathUtility.normalizePath(path);
    }
    createLockPath(path) {
        return this.pathUtility.normalizePath(path, constants_1.WRITE_LOCK_PATH_NAME);
    }
    async acquire(options) {
        const { data = Buffer.from(""), timeout = 1000 } = options !== null && options !== void 0 ? options : {};
        const client = this.ntCuratorFramework.getClient();
        let createdPath = "";
        let timedOut = false;
        const enforceTimeout = async () => new Promise((res) => {
            setTimeout(() => {
                timedOut = true;
                res({ acquired: false, error: new lock_error_1.LockError(lock_error_1.LockErrorCodes.OPERATION_TIMED_OUT, `Acquiring the write lock timed out after ${timeout}ms.`) });
            }, timeout);
        });
        const enforceTimeoutPromise = enforceTimeout();
        const acquireLock = async () => {
            try {
                if (client.getState().code !== node_zookeeper_client_1.State.SYNC_CONNECTED.code) {
                    return { acquired: false, error: new lock_error_1.LockError(lock_error_1.LockErrorCodes.NOT_CONNECTED, "Failed to acquire the write lock because of connection issues.") };
                }
                await this.pathUtility.ensurePathExists(this.nodeAbsolutePath);
                createdPath = await new Promise((res, rej) => {
                    client.create(this.createLockPath(this.nodeAbsolutePath), data, node_zookeeper_client_1.CreateMode.EPHEMERAL_SEQUENTIAL, (error, path) => {
                        if (error)
                            return rej(error);
                        res(path);
                    });
                });
                while (true) {
                    const children = await new Promise((res, rej) => {
                        client.getChildren(this.nodeAbsolutePath, (error, children) => {
                            if (error)
                                return rej(error);
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
                            client.exists(this.pathUtility.normalizePath(this.nodeAbsolutePath, nextLowestSequenceNumberChildPath), (event) => {
                                if (event.type !== node_zookeeper_client_1.Event.NODE_DELETED)
                                    return;
                                res(null);
                            }, (error, stat) => {
                                if (error)
                                    return rej(error);
                                if (!stat)
                                    return res(null);
                            });
                        }),
                    ]);
                    if (timedOut)
                        return { acquired: false, error: new lock_error_1.LockError(lock_error_1.LockErrorCodes.OPERATION_TIMED_OUT, `Acquiring the write lock timed out after ${timeout}ms.`) };
                }
            }
            catch (err) {
                return { acquired: false, error: new lock_error_1.LockError(lock_error_1.LockErrorCodes.UNEXPECTED_ERROR, "An unexpected error occurred while trying to acquire the write lock.") };
            }
            finally {
                if (timedOut && createdPath) {
                    await new Promise((res, rej) => {
                        client.remove(createdPath, 0, (error) => {
                            if (error)
                                return rej(error);
                            res(null);
                        });
                    });
                }
            }
        };
        return Promise.race([
            enforceTimeoutPromise,
            acquireLock(),
        ]);
    }
    async tryAcquire(options) {
        const { data = Buffer.from("") } = options !== null && options !== void 0 ? options : {};
        try {
            const client = this.ntCuratorFramework.getClient();
            if (client.getState().code !== node_zookeeper_client_1.State.SYNC_CONNECTED.code) {
                return { acquired: false, error: new lock_error_1.LockError(lock_error_1.LockErrorCodes.NOT_CONNECTED, "Failed to acquire the write lock because of connection issues.") };
            }
            await this.pathUtility.ensurePathExists(this.nodeAbsolutePath);
            const createdPath = await new Promise((res, rej) => {
                client.create(this.createLockPath(this.nodeAbsolutePath), data, node_zookeeper_client_1.CreateMode.EPHEMERAL_SEQUENTIAL, (error, path) => {
                    if (error)
                        return rej(error);
                    res(path);
                });
            });
            const children = await new Promise((res, rej) => {
                client.getChildren(this.nodeAbsolutePath, (error, children) => {
                    if (error)
                        return rej(error);
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
                    if (error)
                        return rej(error);
                    res(null);
                });
            });
            return { acquired: false, error: null };
        }
        catch (err) {
            return { acquired: false, error: new lock_error_1.LockError(lock_error_1.LockErrorCodes.UNEXPECTED_ERROR, "An unexpected error occurred while trying to acquire the write lock.") };
        }
    }
    async release() {
        try {
            const client = this.ntCuratorFramework.getClient();
            if (client.getState().code !== node_zookeeper_client_1.State.SYNC_CONNECTED.code) {
                return { released: false, error: new lock_error_1.LockError(lock_error_1.LockErrorCodes.NOT_CONNECTED, "Failed to release the write lock because of connection issues.") };
            }
            try {
                await new Promise((res, rej) => {
                    client.remove(this.lockAbsolutePath, 0, (error) => {
                        if (error)
                            return rej(error);
                        res(null);
                    });
                });
            }
            catch (err) {
                const { code } = (0, error_1.parseZooKeeperError)(err);
                if (code !== node_zookeeper_client_1.Exception.NO_NODE)
                    throw err;
            }
            this.lockAbsolutePath = "";
            return { released: true, error: null };
        }
        catch (err) {
            return { released: false, error: new lock_error_1.LockError(lock_error_1.LockErrorCodes.UNEXPECTED_ERROR, "An unexpected error occurred while trying to release the write lock.") };
        }
    }
}
exports.WriteLock = WriteLock;

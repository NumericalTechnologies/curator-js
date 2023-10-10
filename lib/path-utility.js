"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathUtility = void 0;
const path_1 = require("path");
const node_zookeeper_client_1 = require("node-zookeeper-client");
const validation_1 = require("./helpers/validation");
const error_1 = require("./helpers/error");
class PathUtility {
    constructor(ntCuratorFramework) {
        this.ntCuratorFramework = ntCuratorFramework;
    }
    normalizePath(...path) {
        return (0, path_1.join)(...path);
    }
    async ensurePathExists(normalizedPath) {
        const client = this.ntCuratorFramework.getClient();
        const pathsToCreate = normalizedPath
            .split("/")
            .filter((path) => !!path)
            .map((_, index, array) => `/${array.slice(0, index + 1).join("/")}`);
        for (let i = 0; i < pathsToCreate.length; i += 1) {
            try {
                await new Promise((res, rej) => {
                    client.create(pathsToCreate[i], Buffer.from(""), node_zookeeper_client_1.CreateMode.PERSISTENT, (error, path) => {
                        if (error)
                            return rej(error);
                        res(path);
                    });
                });
            }
            catch (err) {
                const { code } = (0, error_1.parseZooKeeperError)(err);
                if (code === node_zookeeper_client_1.Exception.NODE_EXISTS)
                    continue;
            }
        }
    }
    doesLowerSequenceNumberChildPathExist(pathWithSequenceNumber, children) {
        const pathSequenceNumber = (0, validation_1.getNodeSequenceNumber)(pathWithSequenceNumber);
        if (Number.isNaN(pathSequenceNumber))
            return false;
        return !!(children.find((child) => {
            const childSequenceNumber = (0, validation_1.getNodeSequenceNumber)(child);
            if (Number.isNaN(childSequenceNumber))
                return false;
            return childSequenceNumber < pathSequenceNumber;
        }));
    }
    getNextLowestSequenceNumberChildPath(pathWithSequenceNumber, children) {
        let pathSequenceNumber = (0, validation_1.getNodeSequenceNumber)(pathWithSequenceNumber);
        if (Number.isNaN(pathSequenceNumber)) {
            pathSequenceNumber = Number.MIN_SAFE_INTEGER;
        }
        let largestSequenceNumberChildPath = "";
        let largestSequenceNumber = Number.MIN_SAFE_INTEGER;
        for (let i = 0; i < children.length; i += 1) {
            const childPath = children[i];
            const childSequenceNumber = (0, validation_1.getNodeSequenceNumber)(childPath);
            if (Number.isNaN(childSequenceNumber)
                || childSequenceNumber < largestSequenceNumber
                || childSequenceNumber >= pathSequenceNumber)
                continue;
            largestSequenceNumber = childSequenceNumber;
            largestSequenceNumberChildPath = childPath;
        }
        return largestSequenceNumberChildPath;
    }
}
exports.PathUtility = PathUtility;

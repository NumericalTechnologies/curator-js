"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NtCurator = void 0;
const node_zookeeper_client_1 = __importStar(require("node-zookeeper-client"));
const read_lock_1 = require("./locks/read-lock");
const write_lock_1 = require("./locks/write-lock");
class NtCurator {
    constructor(connectionString, config) {
        this.connectionString = connectionString;
        this.config = config;
        this.client = this.createClient();
    }
    async connect() {
        if (this.isConnecting) {
            return false;
        }
        try {
            this.isConnecting = true;
            const state = this.client.getState();
            if (state === node_zookeeper_client_1.State.SYNC_CONNECTED ||
                state === node_zookeeper_client_1.State.CONNECTED_READ_ONLY) {
                return true;
            }
            else if (state === node_zookeeper_client_1.State.DISCONNECTED) {
                const sessionTimeout = this.client.getSessionTimeout();
                return Promise.race([
                    new Promise((res) => {
                        this.once("connected", () => {
                            res(true);
                        });
                        this.client.connect();
                    }),
                    new Promise((res) => {
                        setTimeout(() => {
                            res(false);
                        }, sessionTimeout);
                    }),
                ]);
            }
            else {
                return false;
            }
        }
        finally {
            this.isConnecting = false;
        }
    }
    getClient() {
        return this.client;
    }
    createReadLock(path) {
        return new read_lock_1.ReadLock(this, path);
    }
    createWriteLock(path) {
        return new write_lock_1.WriteLock(this, path);
    }
    addListener(event, cb) {
        this.client.addListener(event, cb);
        return this;
    }
    on(event, cb) {
        this.client.on(event, cb);
        return this;
    }
    once(event, cb) {
        this.client.once(event, cb);
        return this;
    }
    removeListener(event, cb) {
        this.client.removeListener(event, cb);
        return this;
    }
    off(event, cb) {
        this.client.off(event, cb);
        return this;
    }
    removeAllListeners(event) {
        this.client.removeAllListeners(event);
        return this;
    }
    setMaxListeners(n) {
        this.client.setMaxListeners(n);
        return this;
    }
    getMaxListeners() {
        return this.client.getMaxListeners();
    }
    listeners(event) {
        return this.client.listeners(event);
    }
    rawListeners(event) {
        return this.client.rawListeners(event);
    }
    emit(event, ...args) {
        return this.client.emit(event, ...args);
    }
    listenerCount(event) {
        return this.client.listenerCount(event);
    }
    prependListener(event, cb) {
        this.client.prependListener(event, cb);
        return this;
    }
    prependOnceListener(event, cb) {
        this.client.prependOnceListener(event, cb);
        return this;
    }
    eventNames() {
        return this.client
            .eventNames()
            .filter((eventName) => typeof eventName === "string");
    }
    createClient() {
        const client = node_zookeeper_client_1.default.createClient(this.connectionString, this.config);
        client.on("state", (state) => {
            if (state === node_zookeeper_client_1.default.State.EXPIRED) {
                client.close();
                client.removeAllListeners();
                this.client = node_zookeeper_client_1.default.createClient(this.connectionString, this.config);
                this.connect();
            }
        });
        return client;
    }
}
exports.NtCurator = NtCurator;

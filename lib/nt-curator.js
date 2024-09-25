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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NtCurator = void 0;
const node_zookeeper_client_1 = __importStar(require("node-zookeeper-client"));
const read_lock_1 = require("./locks/read-lock");
const write_lock_1 = require("./locks/write-lock");
const events_1 = __importDefault(require("events"));
class NtCurator extends events_1.default {
    constructor(connectionString, config) {
        super();
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
        super.addListener(event, cb);
        return this;
    }
    on(event, cb) {
        super.on(event, cb);
        return this;
    }
    once(event, cb) {
        super.once(event, cb);
        return this;
    }
    removeListener(event, cb) {
        super.removeListener(event, cb);
        return this;
    }
    off(event, cb) {
        super.off(event, cb);
        return this;
    }
    removeAllListeners(event) {
        super.removeAllListeners(event);
        return this;
    }
    listeners(event) {
        return super.listeners(event);
    }
    rawListeners(event) {
        return super.rawListeners(event);
    }
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    listenerCount(event) {
        return super.listenerCount(event);
    }
    prependListener(event, cb) {
        super.prependListener(event, cb);
        return this;
    }
    prependOnceListener(event, cb) {
        super.prependOnceListener(event, cb);
        return this;
    }
    createClient() {
        const client = node_zookeeper_client_1.default.createClient(this.connectionString, this.config);
        this.registerEventHandlers(client);
        return client;
    }
    registerEventHandlers(client) {
        client.on("connected", () => this.emit("connected"));
        client.on("connectedReadOnly", () => this.emit("connectedReadOnly"));
        client.on("disconnected", () => this.emit("disconnected"));
        client.on("expired", () => this.emit("expired"));
        client.on("authenticationFailed", () => this.emit("authenticationFailed"));
        client.on("state", (state) => {
            this.emit("state", state);
            if (state === node_zookeeper_client_1.default.State.EXPIRED) {
                client.close();
                client.removeAllListeners();
                this.client = this.createClient();
                this.connect();
            }
        });
    }
}
exports.NtCurator = NtCurator;

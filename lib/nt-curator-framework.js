"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NtCuratorFramework = void 0;
const node_zookeeper_client_1 = __importDefault(require("node-zookeeper-client"));
class NtCuratorFramework {
    constructor(connectionString, config) {
        this.connectionString = connectionString;
        this.config = config;
    }
    initializeClient() {
        this.client = node_zookeeper_client_1.default.createClient(this.connectionString, this.config);
    }
    getClient() {
        return this.client;
    }
}
exports.NtCuratorFramework = NtCuratorFramework;

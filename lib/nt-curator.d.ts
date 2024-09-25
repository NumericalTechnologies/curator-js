/// <reference types="node" />
import zookeeper, { State } from "node-zookeeper-client";
import { ReadLock } from "./locks/read-lock";
import { WriteLock } from "./locks/write-lock";
import EventEmitter from "events";
import { ConnectivityEventNames, StateChangeEventName } from "./nt-curator.types";
export declare class NtCurator extends EventEmitter {
    connectionString: string;
    config: Parameters<(typeof zookeeper)["createClient"]>[1];
    private isConnecting;
    private client;
    constructor(connectionString: string, config: Parameters<(typeof zookeeper)["createClient"]>[1]);
    connect(): Promise<unknown>;
    getClient(): zookeeper.Client;
    createReadLock(path: string): ReadLock;
    createWriteLock(path: string): WriteLock;
    addListener(event: StateChangeEventName, cb: (state: State) => void): this;
    addListener(event: ConnectivityEventNames, cb: () => void): this;
    on(event: StateChangeEventName, cb: (state: State) => void): this;
    on(event: ConnectivityEventNames, cb: () => void): this;
    once(event: StateChangeEventName, cb: (state: State) => void): this;
    once(event: ConnectivityEventNames, cb: () => void): this;
    removeListener(event: ConnectivityEventNames, cb: () => void): this;
    off(event: ConnectivityEventNames, cb: () => void): this;
    removeAllListeners(event?: ConnectivityEventNames): this;
    listeners(event: ConnectivityEventNames): Function[];
    rawListeners(event: ConnectivityEventNames): Function[];
    emit(event: StateChangeEventName | ConnectivityEventNames, ...args: any[]): boolean;
    listenerCount(event: ConnectivityEventNames): number;
    prependListener(event: ConnectivityEventNames, cb: () => void): this;
    prependOnceListener(event: ConnectivityEventNames, cb: () => void): this;
    private createClient;
    private registerEventHandlers;
}

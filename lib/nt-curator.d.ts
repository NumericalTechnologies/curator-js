/// <reference types="node" />
import zookeeper, { State } from "node-zookeeper-client";
import { ReadLock } from "./locks/read-lock";
import { WriteLock } from "./locks/write-lock";
import EventEmitter from "events";
import { ConnectivityEvents } from "./nt-curator.types";
export declare class NtCurator implements EventEmitter {
    private connectionString;
    private config;
    private isConnecting;
    private client;
    constructor(connectionString: string, config: Parameters<(typeof zookeeper)["createClient"]>[1]);
    connect(): Promise<unknown>;
    getClient(): zookeeper.Client;
    createReadLock(path: string): ReadLock;
    createWriteLock(path: string): WriteLock;
    addListener(event: "state", cb: (state: State) => void): this;
    addListener(event: ConnectivityEvents, cb: () => void): this;
    on(event: "state", cb: (state: State) => void): this;
    on(event: ConnectivityEvents, cb: () => void): this;
    once(event: "state", cb: (state: State) => void): this;
    once(event: ConnectivityEvents, cb: () => void): this;
    removeListener(event: ConnectivityEvents, cb: () => void): this;
    off(event: ConnectivityEvents, cb: () => void): this;
    removeAllListeners(event?: ConnectivityEvents): this;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    listeners(event: ConnectivityEvents): Function[];
    rawListeners(event: ConnectivityEvents): Function[];
    emit(event: ConnectivityEvents, ...args: any[]): boolean;
    listenerCount(event: ConnectivityEvents): number;
    prependListener(event: ConnectivityEvents, cb: () => void): this;
    prependOnceListener(event: ConnectivityEvents, cb: () => void): this;
    eventNames(): Array<string>;
    private createClient;
}

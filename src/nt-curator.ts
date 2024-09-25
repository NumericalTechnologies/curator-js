import zookeeper, { State } from "node-zookeeper-client";
import { ReadLock } from "./locks/read-lock";
import { WriteLock } from "./locks/write-lock";
import EventEmitter from "events";
import {
  ConnectivityEventNames,
  StateChangeEventName,
} from "./nt-curator.types";

export class NtCurator extends EventEmitter {
  private isConnecting: boolean;
  private client: zookeeper.Client;

  constructor(
    public connectionString: string,
    public config: Parameters<(typeof zookeeper)["createClient"]>[1]
  ) {
    super();
    this.client = this.createClient();
  }

  public async connect() {
    if (this.isConnecting) {
      return false;
    }

    try {
      this.isConnecting = true;

      const state = this.client.getState();
      if (
        state === State.SYNC_CONNECTED ||
        state === State.CONNECTED_READ_ONLY
      ) {
        return true;
      } else if (state === State.DISCONNECTED) {
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
      } else {
        return false;
      }
    } finally {
      this.isConnecting = false;
    }
  }

  public getClient() {
    return this.client;
  }

  public createReadLock(path: string) {
    return new ReadLock(this, path);
  }

  public createWriteLock(path: string) {
    return new WriteLock(this, path);
  }

  public addListener(
    event: StateChangeEventName,
    cb: (state: State) => void
  ): this;
  public addListener(event: ConnectivityEventNames, cb: () => void): this;
  public addListener(
    event: StateChangeEventName | ConnectivityEventNames,
    cb: ((state: State) => void) | (() => void)
  ): this {
    super.addListener(event, cb);
    return this;
  }

  public on(event: StateChangeEventName, cb: (state: State) => void): this;
  public on(event: ConnectivityEventNames, cb: () => void): this;
  public on(
    event: StateChangeEventName | ConnectivityEventNames,
    cb: ((state?: State) => void) | (() => void)
  ): this {
    super.on(event, cb);
    return this;
  }

  public once(event: StateChangeEventName, cb: (state: State) => void): this;
  public once(event: ConnectivityEventNames, cb: () => void): this;
  public once(
    event: StateChangeEventName | ConnectivityEventNames,
    cb: ((state?: State) => void) | (() => void)
  ): this {
    super.once(event, cb);
    return this;
  }

  public removeListener(event: ConnectivityEventNames, cb: () => void): this {
    super.removeListener(event, cb);
    return this;
  }

  public off(event: ConnectivityEventNames, cb: () => void): this {
    super.off(event, cb);
    return this;
  }

  public removeAllListeners(event?: ConnectivityEventNames): this {
    super.removeAllListeners(event);
    return this;
  }

  public listeners(event: ConnectivityEventNames): Function[] {
    return super.listeners(event);
  }

  public rawListeners(event: ConnectivityEventNames): Function[] {
    return super.rawListeners(event);
  }

  public emit(
    event: StateChangeEventName | ConnectivityEventNames,
    ...args: any[]
  ): boolean {
    return super.emit(event, ...args);
  }

  public listenerCount(event: ConnectivityEventNames): number {
    return super.listenerCount(event);
  }

  public prependListener(event: ConnectivityEventNames, cb: () => void): this {
    super.prependListener(event, cb);
    return this;
  }

  public prependOnceListener(
    event: ConnectivityEventNames,
    cb: () => void
  ): this {
    super.prependOnceListener(event, cb);
    return this;
  }

  private createClient() {
    const client = zookeeper.createClient(this.connectionString, this.config);

    this.registerEventHandlers(client);

    return client;
  }

  private registerEventHandlers(client: zookeeper.Client) {
    client.on("connected", () => this.emit("connected"));
    client.on("connectedReadOnly", () => this.emit("connectedReadOnly"));
    client.on("disconnected", () => this.emit("disconnected"));
    client.on("expired", () => this.emit("expired"));
    client.on("authenticationFailed", () => this.emit("authenticationFailed"));

    client.on("state", (state) => {
      this.emit("state", state);

      if (state === zookeeper.State.EXPIRED) {
        client.close();
        client.removeAllListeners();

        this.client = this.createClient();
        this.connect();
      }
    });
  }
}

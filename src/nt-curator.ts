import zookeeper, { State } from "node-zookeeper-client";
import { ReadLock } from "./locks/read-lock";
import { WriteLock } from "./locks/write-lock";
import EventEmitter from "events";
import { ConnectivityEvents } from "./nt-curator.types";

export class NtCurator implements EventEmitter {
  private isConnecting: boolean;
  private client: zookeeper.Client;

  constructor(
    public connectionString: string,
    public config: Parameters<(typeof zookeeper)["createClient"]>[1]
  ) {
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

  public addListener(event: "state", cb: (state: State) => void): this;
  public addListener(event: ConnectivityEvents, cb: () => void): this;
  public addListener(
    event: ConnectivityEvents | "state",
    cb: ((state?: State) => void) | (() => void)
  ): this {
    this.client.addListener(event, cb);
    return this;
  }

  public on(event: "state", cb: (state: State) => void): this;
  public on(event: ConnectivityEvents, cb: () => void): this;
  public on(
    event: ConnectivityEvents | "state",
    cb: ((state?: State) => void) | (() => void)
  ): this {
    this.client.on(event, cb);
    return this;
  }

  public once(event: "state", cb: (state: State) => void): this;
  public once(event: ConnectivityEvents, cb: () => void): this;
  public once(
    event: ConnectivityEvents | "state",
    cb: ((state?: State) => void) | (() => void)
  ): this {
    this.client.once(event, cb);
    return this;
  }

  public removeListener(event: ConnectivityEvents, cb: () => void): this {
    this.client.removeListener(event, cb);
    return this;
  }

  public off(event: ConnectivityEvents, cb: () => void): this {
    this.client.off(event, cb);
    return this;
  }

  public removeAllListeners(event?: ConnectivityEvents): this {
    this.client.removeAllListeners(event);
    return this;
  }

  public setMaxListeners(n: number): this {
    this.client.setMaxListeners(n);
    return this;
  }

  public getMaxListeners(): number {
    return this.client.getMaxListeners();
  }

  public listeners(event: ConnectivityEvents): Function[] {
    return this.client.listeners(event);
  }

  public rawListeners(event: ConnectivityEvents): Function[] {
    return this.client.rawListeners(event);
  }

  public emit(event: ConnectivityEvents, ...args: any[]): boolean {
    return this.client.emit(event, ...args);
  }

  public listenerCount(event: ConnectivityEvents): number {
    return this.client.listenerCount(event);
  }

  public prependListener(event: ConnectivityEvents, cb: () => void): this {
    this.client.prependListener(event, cb);
    return this;
  }

  public prependOnceListener(event: ConnectivityEvents, cb: () => void): this {
    this.client.prependOnceListener(event, cb);
    return this;
  }

  public eventNames(): Array<string> {
    return this.client
      .eventNames()
      .filter(
        (eventName): eventName is string => typeof eventName === "string"
      );
  }

  private createClient() {
    const client = zookeeper.createClient(this.connectionString, this.config);

    client.on("state", (state) => {
      if (state === zookeeper.State.EXPIRED) {
        client.close();
        client.removeAllListeners();

        this.client = zookeeper.createClient(
          this.connectionString,
          this.config
        );
        this.connect();
      }
    });

    return client;
  }
}

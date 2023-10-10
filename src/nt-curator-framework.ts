import zookeeper from "node-zookeeper-client";

export class NtCuratorFramework {
  public client: zookeeper.Client;

  public connectionString: string;

  public config: Parameters<typeof zookeeper["createClient"]>[1];

  constructor(connectionString: string, config: Parameters<typeof zookeeper["createClient"]>[1]) {
    this.connectionString = connectionString;
    this.config = config;
  }

  public initializeClient() {
    this.client = zookeeper.createClient(this.connectionString, this.config);
  }

  public getClient() {
    return this.client;
  }
}

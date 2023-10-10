import zookeeper from "node-zookeeper-client";
export declare class NtCuratorFramework {
    client: zookeeper.Client;
    connectionString: string;
    config: Parameters<typeof zookeeper["createClient"]>[1];
    constructor(connectionString: string, config: Parameters<typeof zookeeper["createClient"]>[1]);
    initializeClient(): void;
    getClient(): zookeeper.Client;
}

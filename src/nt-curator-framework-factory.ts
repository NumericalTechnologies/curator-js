import { NtCuratorFramework } from "./nt-curator-framework";

export class NtCuratorFrameworkFactory {
  public static createClient(...params: ConstructorParameters<typeof NtCuratorFramework>) {
    return new NtCuratorFramework(...params);
  }
}

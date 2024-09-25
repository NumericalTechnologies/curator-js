import { v4 as uuidv4 } from "uuid";
import { NtCurator } from "../src/nt-curator";
import { State } from "node-zookeeper-client";

export async function createNtCuratorAndConnect() {
  const ntCurator = new NtCurator("localhost:2181", {
    sessionTimeout: 1000,
    spinDelay: 1000,
    retries: 0,
  });

  jest.spyOn(ntCurator, "connect").mockResolvedValue(true);
  jest.spyOn(ntCurator.getClient(), "getState").mockReturnValue({
    code: State.SYNC_CONNECTED.code,
    name: State.SYNC_CONNECTED.name,
  });

  await ntCurator.connect();
  return ntCurator;
}

export function createRandomizedPath(levels: number = 1) {
  let path = "";

  if (levels <= 0) throw new Error("parameter 0 should be > 1");

  for (let i = 0; i < levels; i += 1) {
    path += `/${uuidv4()}`;
  }
  return path;
}

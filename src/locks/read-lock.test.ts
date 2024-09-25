import { ReadLock } from "./read-lock";
import { PathUtility } from "../path-utility";
import {
  createNtCuratorAndConnect,
  createRandomizedPath,
} from "../../tests/util";

const READ_LOCK_PATH_NAME = "read-";
const WRITE_LOCK_PATH_NAME = "write-";

describe("ReadLock", () => {
  describe("tryAcquire", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("should return false if recursive creation of non-leaf nodes failed", async () => {
      jest
        .spyOn(PathUtility.prototype, "ensurePathExists")
        .mockRejectedValue(new Error());
      const ntCurator = await createNtCuratorAndConnect();
      const path = createRandomizedPath();
      const readLock = new ReadLock(ntCurator, path);
      const { acquired, error } = await readLock.tryAcquire();
      expect(acquired).toBe(false);
      expect(error).toBeInstanceOf(Error);
    });

    it("should return false if the creation of the leaf read lock node failed", async () => {
      const ntCurator = await createNtCuratorAndConnect();
      const client = ntCurator.getClient();

      jest.spyOn(PathUtility.prototype, "ensurePathExists").mockResolvedValue();
      jest
        .spyOn(client, "create")
        .mockImplementation((path, p1, p2, p3, p4) => {
          if (typeof p1 === "function") return (p1 as Function)(new Error());
          if (typeof p2 === "function") return (p2 as Function)(new Error());
          if (typeof p3 === "function") return (p3 as Function)(new Error());
          if (typeof p4 === "function") return (p4 as Function)(new Error());
        });
      const path = createRandomizedPath();
      const readLock = new ReadLock(ntCurator, path);
      const { acquired, error } = await readLock.tryAcquire();
      expect(acquired).toBe(false);
      expect(error).toBeInstanceOf(Error);
    });

    it("should return false if getting the children of level before leaf read lock node failed", async () => {
      const ntCurator = await createNtCuratorAndConnect();
      const client = ntCurator.getClient();

      jest.spyOn(PathUtility.prototype, "ensurePathExists").mockResolvedValue();
      jest
        .spyOn(client, "create")
        .mockImplementation((path, p1, p2, p3, p4) => {
          const node = `${READ_LOCK_PATH_NAME}0000000002`;
          if (typeof p1 === "function") return (p1 as Function)(null, node);
          if (typeof p2 === "function") return (p2 as Function)(null, node);
          if (typeof p3 === "function") return (p3 as Function)(null, node);
          if (typeof p4 === "function") return (p4 as Function)(null, node);
        });
      jest.spyOn(client, "getChildren").mockImplementation((path, p1, p2) => {
        const stat = {
          czxid: 0,
          mzxid: 0,
          ctime: 0,
          mtime: 0,
          version: 0,
          cversion: 0,
          aversion: 0,
          ephemeralOwner: 0,
          dataLength: 0,
          numChildren: 0,
          pzxid: 0,
        };
        if (typeof p2 === "function") return p2(new Error(), [], stat);
        if (typeof p1 === "function")
          return (p1 as Function)(new Error(), [], stat);
      });
      const path = createRandomizedPath();
      const readLock = new ReadLock(ntCurator, path);
      const { acquired, error } = await readLock.tryAcquire();
      expect(acquired).toBe(false);
      expect(error).toBeInstanceOf(Error);
    });

    it("should return false if there exist a sibling node that is a write node and has a smaller sequence number", async () => {
      const ntCurator = await createNtCuratorAndConnect();
      const client = ntCurator.getClient();

      jest.spyOn(PathUtility.prototype, "ensurePathExists").mockResolvedValue();
      jest
        .spyOn(client, "create")
        .mockImplementation((path, p1, p2, p3, p4) => {
          const node = `${READ_LOCK_PATH_NAME}0000000002`;
          if (typeof p1 === "function") return (p1 as Function)(null, node);
          if (typeof p2 === "function") return (p2 as Function)(null, node);
          if (typeof p3 === "function") return (p3 as Function)(null, node);
          if (typeof p4 === "function") return (p4 as Function)(null, node);
        });
      jest.spyOn(client, "getChildren").mockImplementation((path, p1, p2) => {
        const children = [`${WRITE_LOCK_PATH_NAME}0000000001`];
        const stat = {
          czxid: 0,
          mzxid: 0,
          ctime: 0,
          mtime: 0,
          version: 0,
          cversion: 0,
          aversion: 0,
          ephemeralOwner: 0,
          dataLength: 0,
          numChildren: 0,
          pzxid: 0,
        };
        if (typeof p2 === "function")
          return (p2 as Function)(null, children, stat);
        if (typeof p1 === "function")
          return (p1 as Function)(null, children, stat);
      });
      jest.spyOn(client, "remove").mockImplementation((path, p1, p2) => {
        if (typeof p1 === "function") return (p1 as Function)(null);
        if (typeof p2 === "function") return (p2 as Function)(null);
      });
      const path = createRandomizedPath();
      const readLock = new ReadLock(ntCurator, path);
      await expect(readLock.tryAcquire()).resolves.toStrictEqual({
        acquired: false,
        error: null,
      });
    });

    it("should return true if there exist a sibling node that is a write node but has a bigger sequence number", async () => {
      const ntCurator = await createNtCuratorAndConnect();
      const client = ntCurator.getClient();

      jest.spyOn(PathUtility.prototype, "ensurePathExists").mockResolvedValue();
      jest
        .spyOn(client, "create")
        .mockImplementation((path, p1, p2, p3, p4) => {
          const node = `${READ_LOCK_PATH_NAME}0000000001`;
          if (typeof p1 === "function") return (p1 as Function)(null, node);
          if (typeof p2 === "function") return (p2 as Function)(null, node);
          if (typeof p3 === "function") return (p3 as Function)(null, node);
          if (typeof p4 === "function") return (p4 as Function)(null, node);
        });
      jest.spyOn(client, "getChildren").mockImplementation((path, p1, p2) => {
        const children = [`${WRITE_LOCK_PATH_NAME}0000000002`];
        const stat = {
          czxid: 0,
          mzxid: 0,
          ctime: 0,
          mtime: 0,
          version: 0,
          cversion: 0,
          aversion: 0,
          ephemeralOwner: 0,
          dataLength: 0,
          numChildren: 0,
          pzxid: 0,
        };
        if (typeof p2 === "function")
          return (p2 as Function)(null, children, stat);
        if (typeof p1 === "function")
          return (p1 as Function)(null, children, stat);
      });
      const path = createRandomizedPath();
      const readLock = new ReadLock(ntCurator, path);
      await expect(readLock.tryAcquire()).resolves.toStrictEqual({
        acquired: true,
        error: null,
      });
    });

    it("should return true if there exist a sibling node that is a read node but has a smaller sequence number", async () => {
      const ntCurator = await createNtCuratorAndConnect();
      const client = ntCurator.getClient();

      jest.spyOn(PathUtility.prototype, "ensurePathExists").mockResolvedValue();
      jest
        .spyOn(client, "create")
        .mockImplementation((path, p1, p2, p3, p4) => {
          const node = `${READ_LOCK_PATH_NAME}0000000002`;
          if (typeof p1 === "function") return (p1 as Function)(null, node);
          if (typeof p2 === "function") return (p2 as Function)(null, node);
          if (typeof p3 === "function") return (p3 as Function)(null, node);
          if (typeof p4 === "function") return (p4 as Function)(null, node);
        });
      jest.spyOn(client, "getChildren").mockImplementation((path, p1, p2) => {
        const children = [`${READ_LOCK_PATH_NAME}0000000001`];
        const stat = {
          czxid: 0,
          mzxid: 0,
          ctime: 0,
          mtime: 0,
          version: 0,
          cversion: 0,
          aversion: 0,
          ephemeralOwner: 0,
          dataLength: 0,
          numChildren: 0,
          pzxid: 0,
        };
        if (typeof p2 === "function")
          return (p2 as Function)(null, children, stat);
        if (typeof p1 === "function")
          return (p1 as Function)(null, children, stat);
      });
      const path = createRandomizedPath();
      const readLock = new ReadLock(ntCurator, path);
      await expect(readLock.tryAcquire()).resolves.toStrictEqual({
        acquired: true,
        error: null,
      });
    });

    it("should return true if there exist a sibling node that is a read node but has a bigger sequence number", async () => {
      const ntCurator = await createNtCuratorAndConnect();
      const client = ntCurator.getClient();

      jest.spyOn(PathUtility.prototype, "ensurePathExists").mockResolvedValue();
      jest
        .spyOn(client, "create")
        .mockImplementation((path, p1, p2, p3, p4) => {
          const node = `${READ_LOCK_PATH_NAME}0000000001`;
          if (typeof p1 === "function") return (p1 as Function)(null, node);
          if (typeof p2 === "function") return (p2 as Function)(null, node);
          if (typeof p3 === "function") return (p3 as Function)(null, node);
          if (typeof p4 === "function") return (p4 as Function)(null, node);
        });
      jest.spyOn(client, "getChildren").mockImplementation((path, p1, p2) => {
        const children = [`${READ_LOCK_PATH_NAME}0000000002`];
        const stat = {
          czxid: 0,
          mzxid: 0,
          ctime: 0,
          mtime: 0,
          version: 0,
          cversion: 0,
          aversion: 0,
          ephemeralOwner: 0,
          dataLength: 0,
          numChildren: 0,
          pzxid: 0,
        };
        if (typeof p2 === "function")
          return (p2 as Function)(null, children, stat);
        if (typeof p1 === "function")
          return (p1 as Function)(null, children, stat);
      });
      const path = createRandomizedPath();
      const readLock = new ReadLock(ntCurator, path);
      await expect(readLock.tryAcquire()).resolves.toStrictEqual({
        acquired: true,
        error: null,
      });
    });
  });

  describe("release", () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("should return true if the read node deletion failed as there's no node found", async () => {
      const ntCurator = await createNtCuratorAndConnect();
      const client = ntCurator.getClient();

      jest.spyOn(client, "remove").mockImplementation((path, p1, p2) => {
        const error = new Error("-101 No node found");
        if (typeof p1 === "function") return (p1 as Function)(error);
        if (typeof p2 === "function") return (p2 as Function)(error);
      });

      const path = createRandomizedPath();
      const readLock = new ReadLock(ntCurator, path);
      readLock["lockAbsolutePath"] = `${path}/${READ_LOCK_PATH_NAME}0000000001`;
      await expect(readLock.release()).resolves.toStrictEqual({
        released: true,
        error: null,
      });
    });

    it("should return false if the read node deletion failed with unrelated errors", async () => {
      const ntCurator = await createNtCuratorAndConnect();
      const client = ntCurator.getClient();

      jest.spyOn(client, "remove").mockImplementation((path, p1, p2) => {
        const error = new Error("-999 Unknown Error");
        if (typeof p1 === "function") return (p1 as Function)(error);
        if (typeof p2 === "function") return (p2 as Function)(error);
      });
      const path = createRandomizedPath();
      const readLock = new ReadLock(ntCurator, path);
      readLock["lockAbsolutePath"] = `${path}/${READ_LOCK_PATH_NAME}0000000001`;
      const { released, error } = await readLock.release();
      expect(released).toBe(false);
      expect(error).toBeInstanceOf(Error);
    });

    it("should return true if the read node is successfully deleted", async () => {
      const ntCurator = await createNtCuratorAndConnect();
      const client = ntCurator.getClient();

      jest.spyOn(client, "remove").mockImplementation((path, p1, p2) => {
        if (typeof p1 === "function") return (p1 as Function)(null);
        if (typeof p2 === "function") return (p2 as Function)(null);
      });

      const path = createRandomizedPath();
      const readLock = new ReadLock(ntCurator, path);
      readLock["lockAbsolutePath"] = `${path}/${READ_LOCK_PATH_NAME}0000000001`;
      await expect(readLock.release()).resolves.toStrictEqual({
        released: true,
        error: null,
      });
    });
  });
});

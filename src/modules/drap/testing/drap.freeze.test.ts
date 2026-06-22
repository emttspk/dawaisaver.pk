import { strict as assert } from "node:assert";
import { clearPrismaService, getMirrorRuntimeState, setPrismaService } from "../drap.freeze";

describe("DRAP runtime gate", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    clearPrismaService();
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  });

  it("allows an explicit running control row to override the env pause gate", async () => {
    process.env.MIRROR_ENABLED = "false";
    process.env.MIRROR_MIGRATION_MODE = "true";

    setPrismaService({
      mirrorRuntimeControl: {
        findUnique: jest.fn().mockResolvedValue({ state: "running" }),
      },
      importBatch: {
        findFirst: jest.fn().mockResolvedValue({ updatedAt: new Date() }),
      },
    } as any);

    const state = await getMirrorRuntimeState();

    assert.equal(state, "RUNNING");
  });

  it("stays running when a current worker is fresh even if sibling batches may be old", async () => {
    const findFirst = jest.fn().mockResolvedValue({ updatedAt: new Date() });
    setPrismaService({
      mirrorRuntimeControl: {
        findUnique: jest.fn().mockResolvedValue({ state: "running" }),
      },
      importBatch: { findFirst },
    } as any);

    const state = await getMirrorRuntimeState();

    assert.equal(state, "RUNNING");
    assert.deepEqual(findFirst.mock.calls[0][0].orderBy, { updatedAt: "desc" });
    assert.equal(findFirst.mock.calls[0][0].where.updatedAt, undefined);
  });

  it("reports interrupted when every running batch heartbeat is stale", async () => {
    setPrismaService({
      mirrorRuntimeControl: {
        findUnique: jest.fn().mockResolvedValue({ state: "running" }),
      },
      importBatch: {
        findFirst: jest.fn().mockResolvedValue({ updatedAt: new Date(Date.now() - 31 * 60 * 1000) }),
      },
    } as any);

    const state = await getMirrorRuntimeState();

    assert.equal(state, "INTERRUPTED");
  });

  it("falls back to the env gate when there is no runtime control record", async () => {
    process.env.MIRROR_ENABLED = "false";
    process.env.MIRROR_MIGRATION_MODE = "true";

    const state = await getMirrorRuntimeState();

    assert.equal(state, "PAUSED");
  });
});

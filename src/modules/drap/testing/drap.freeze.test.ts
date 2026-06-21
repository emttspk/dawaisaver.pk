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
    } as any);

    const state = await getMirrorRuntimeState();

    assert.equal(state, "RUNNING");
  });

  it("falls back to the env gate when there is no runtime control record", async () => {
    process.env.MIRROR_ENABLED = "false";
    process.env.MIRROR_MIGRATION_MODE = "true";

    const state = await getMirrorRuntimeState();

    assert.equal(state, "PAUSED");
  });
});

import { strict as assert } from "node:assert";
import { ConfigService } from "@nestjs/config";

const spawnMock = jest.fn();

jest.mock("child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

import { DrapMirrorWorkerLauncherService } from "../drap-mirror-worker-launcher.service";

describe("DrapMirrorWorkerLauncherService", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    spawnMock.mockReset();
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  });

  it("skips spawning when the latest batch is still fresh", async () => {
    const now = Date.now();
    const prisma = {
      importBatch: {
        findFirst: jest.fn().mockResolvedValue({
          id: "batch-fresh",
          updatedAt: new Date(now - 2 * 60 * 1000),
          metadata: {},
        }),
      },
    };
    const service = new DrapMirrorWorkerLauncherService(prisma as any, {} as ConfigService);

    const result = await service.launchWorker("start");

    assert.equal(result.alreadyRunning, true);
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("spawns when the latest batch is stale", async () => {
    const now = Date.now();
    const workerProcess = {
      pid: 12345,
      unref: jest.fn(),
      on: jest.fn(),
    };
    spawnMock.mockReturnValue(workerProcess);

    const prisma = {
      importBatch: {
        findFirst: jest.fn().mockResolvedValue({
          id: "batch-stale",
          updatedAt: new Date(now - 10 * 60 * 1000),
          metadata: {},
        }),
      },
    };
    const service = new DrapMirrorWorkerLauncherService(prisma as any, {} as ConfigService);

    const result = await service.launchWorker("resume");

    assert.equal(result.alreadyRunning, false);
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(workerProcess.unref).toHaveBeenCalledTimes(1);
  });

  it("treats a batch with recent heartbeat as live even if updatedAt is old", async () => {
    const now = Date.now();
    const workerProcess = {
      pid: 12345,
      unref: jest.fn(),
      on: jest.fn(),
    };

    const prisma = {
      importBatch: {
        findFirst: jest.fn().mockResolvedValue({
          id: "batch-heartbeat",
          updatedAt: new Date(now - 15 * 60 * 1000),
          metadata: {
            acquisition: {
              lastActivityAt: new Date(now - 60 * 1000).toISOString(),
            },
          },
        }),
      },
    };
    const service = new DrapMirrorWorkerLauncherService(prisma as any, {} as ConfigService);

    const result = await service.launchWorker("recover");

    assert.equal(result.alreadyRunning, true);
    expect(spawnMock).not.toHaveBeenCalled();
  });
});

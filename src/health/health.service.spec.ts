import { HealthService } from "./health.service";

describe("HealthService", () => {
  it("returns application health", () => {
    const prisma = { isHealthy: jest.fn() } as never;
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          "app.name": "DawaiSaver.pk API",
          "app.nodeEnv": "test",
        };
        return values[key];
      }),
    } as never;
    const service = new HealthService(prisma, config);

    expect(service.applicationHealth().status).toBe("ok");
    expect(service.applicationHealth().name).toBe("DawaiSaver.pk API");
    expect(service.applicationHealth().deployment).toEqual({
      commitSha: "unknown",
      source: "unavailable",
    });
  });

  it("returns deployment fingerprint", () => {
    const prisma = { isHealthy: jest.fn() } as never;
    const config = { get: jest.fn() } as never;
    const service = new HealthService(prisma, config);

    expect(service.deploymentHealth()).toEqual({
      commitSha: "unknown",
      source: "unavailable",
    });
  });

  it("returns database health", async () => {
    const prisma = { isHealthy: jest.fn().mockResolvedValue(true) } as never;
    const config = { get: jest.fn() } as never;
    const service = new HealthService(prisma, config);

    await expect(service.databaseHealth()).resolves.toMatchObject({
      status: "ok",
      provider: "postgresql",
    });
  });
});

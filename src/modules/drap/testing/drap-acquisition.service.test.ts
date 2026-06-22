import { strict as assert } from "node:assert";
import { DrapAcquisitionService } from "../drap.acquisition.service";
import { UploadService } from "../../ocr/upload.service";

describe("DRAP acquisition service", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  });

  it("reports missing R2 variables without exposing secrets", () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.R2_PUBLIC_BASE_URL;

    process.env.R2_BUCKET_NAME = "dawaisaver-pk";

    const service = new DrapAcquisitionService({} as any, new UploadService());
    const report = service.verifyR2Configuration();

    assert.deepEqual(report.required, [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
    ]);
    assert.deepEqual(report.present, ["R2_BUCKET_NAME"]);
    assert.deepEqual(report.missing, [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
    ]);
  });

  it("enumerates and deduplicates registration probes", () => {
    const service = new DrapAcquisitionService({} as any, new UploadService());

    const explicit = service.enumerateRegistrations({
      registrations: ["031356", "031356", "EX-031356"],
      includeLegacyVariants: false,
    });

    assert.equal(explicit.length, 2);
    assert.equal(explicit[0].registrationNumber, "031356");
    assert.equal(explicit[1].registrationNumber, "EX-031356");

    const ranged = service.enumerateRegistrations({
      startRegistration: "000001",
      endRegistration: "000003",
    });

    assert.deepEqual(
      ranged.map((item) => item.registrationNumber),
      ["000001", "000002", "000003"],
    );
  });

  it("synchronizes import batch summary counters when persisting a checkpoint", async () => {
    const updates: unknown[] = [];
    const prisma = {
      importBatch: {
        update: async (args: unknown) => {
          updates.push(args);
          return args;
        },
      },
    };
    const service = new DrapAcquisitionService(prisma as any, new UploadService());

    await (service as any).persistBatchState(
      { id: "batch-1", metadata: null, importReport: null },
      {
        batchId: "batch-1",
        nextIndex: 6400,
        lastRegistrationNumber: "060249",
        processed: 6400,
        fetched: 6400,
        parsed: 6246,
        failed: 154,
        duplicate: 12,
        retries: 3,
      },
      { required: [], present: [], missing: [] },
    );

    assert.equal(updates.length, 1);
    assert.deepEqual((updates[0] as any).data.validRows, 6246);
    assert.deepEqual((updates[0] as any).data.invalidRows, 154);
    assert.deepEqual((updates[0] as any).data.duplicateRows, 12);
    assert.deepEqual((updates[0] as any).data.savedRows, 6246);
    assert.deepEqual((updates[0] as any).data.metadata.acquisition.checkpoint.processed, 6400);
  });
});

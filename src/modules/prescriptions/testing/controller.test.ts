import { strict as assert } from "node:assert";
import { PrescriptionsController } from "../controllers/prescriptions.controller";
import { sampleCanonicalCandidates, samplePrescriptionText } from "./sample-prescription.dataset";

describe("Prescription controller", () => {
  it("processes text prescriptions through the pipeline", async () => {
    const prisma: any = {
      prescription: {
        create: async () => ({ id: "rx-1" }),
        findUnique: async () => null,
      },
      canonicalProduct: {
        findMany: async () => sampleCanonicalCandidates.map((candidate) => ({
          id: candidate.id,
          productId: candidate.productId,
          normalizedBrand: candidate.brandName,
          normalizedGeneric: candidate.genericName,
          normalizedStrength: candidate.strength,
          normalizedDosageForm: candidate.dosageForm,
          normalizedManufacturer: candidate.manufacturer,
          packSize: candidate.packSize,
          registrationNumber: candidate.registrationNumber,
          medicineSignature: candidate.medicineSignature,
        })),
      },
      productPrice: {
        findMany: async () => [],
      },
      prescriptionItem: {
        createMany: async () => undefined,
      },
      prescriptionProcessingJob: {
        create: async () => undefined,
      },
      prescriptionCostEstimate: {
        create: async () => undefined,
      },
    };

    const controller = new PrescriptionsController(prisma);
    const result = await controller.submitTextPrescription({
      text: samplePrescriptionText,
      city: "Karachi",
    } as any);

    assert.equal(result.prescriptionId, "rx-1");
    assert.equal(result.items.length, 2);
    assert.ok(result.costEstimate.originalEstimatedCost >= 0);
  });
});


import { PrismaClient, RecordStatus, SourceType } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function deterministicUuid(seed: string): string {
  const hash = createHash('sha256').update(seed).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

const commonSeedFields = {
  status: RecordStatus.VERIFIED,
  sourceType: SourceType.SYSTEM,
  confidenceScore: "0.9500",
  metadata: {
    seedDataset: "closed-beta-minimal",
    note: "Minimal launch dataset for DawaiSaver.pk beta verification. Replace or enrich with audited DRAP/import data.",
  },
};

const medicines = [
  {
    brandName: "Panadol",
    normalizedBrand: "panadol",
    displayName: "Panadol 500mg Tablet",
    dosageForm: "Tablet",
    normalizedForm: "tablet",
    strengthText: "500mg",
    packSize: "10 tablets",
    registrationNumber: "BETA-PANADOL-500-TAB",
    signature: "paracetamol|500mg|tablet",
    manufacturer: {
      name: "Haleon Pakistan Limited",
      normalizedName: "haleon pakistan limited",
      country: "Pakistan",
    },
    generic: {
      name: "Paracetamol",
      normalizedName: "paracetamol",
      aliases: ["Acetaminophen"],
      strengthValue: "500.0000",
      strengthUnit: "mg",
    },
  },
  {
    brandName: "Calpol",
    normalizedBrand: "calpol",
    displayName: "Calpol 500mg Tablet",
    dosageForm: "Tablet",
    normalizedForm: "tablet",
    strengthText: "500mg",
    packSize: "10 tablets",
    registrationNumber: "BETA-CALPOL-500-TAB",
    signature: "paracetamol|500mg|tablet",
    manufacturer: {
      name: "GSK Pakistan Limited",
      normalizedName: "gsk pakistan limited",
      country: "Pakistan",
    },
    generic: {
      name: "Paracetamol",
      normalizedName: "paracetamol",
      aliases: ["Acetaminophen"],
      strengthValue: "500.0000",
      strengthUnit: "mg",
    },
  },
  {
    brandName: "Brufen",
    normalizedBrand: "brufen",
    displayName: "Brufen 400mg Tablet",
    dosageForm: "Tablet",
    normalizedForm: "tablet",
    strengthText: "400mg",
    packSize: "10 tablets",
    registrationNumber: "BETA-BRUFEN-400-TAB",
    signature: "ibuprofen|400mg|tablet",
    manufacturer: {
      name: "Abbott Laboratories Pakistan Limited",
      normalizedName: "abbott laboratories pakistan limited",
      country: "Pakistan",
    },
    generic: {
      name: "Ibuprofen",
      normalizedName: "ibuprofen",
      aliases: [],
      strengthValue: "400.0000",
      strengthUnit: "mg",
    },
  },
];

async function main() {
  const seededProducts: Array<{ id: string; signature: string; displayName: string }> = [];

  for (const medicine of medicines) {
    const manufacturer =
      (await prisma.manufacturer.findFirst({
        where: { normalizedName: medicine.manufacturer.normalizedName },
      })) ??
      (await prisma.manufacturer.create({
        data: {
          ...commonSeedFields,
          ...medicine.manufacturer,
          aliases: [],
        },
      }));

    await prisma.manufacturer.update({
      where: { id: manufacturer.id },
      data: {
        ...commonSeedFields,
        ...medicine.manufacturer,
      },
    });

    const generic = await prisma.generic.upsert({
      where: { normalizedName: medicine.generic.normalizedName },
      update: {
        ...commonSeedFields,
        name: medicine.generic.name,
        aliases: medicine.generic.aliases,
      },
      create: {
        ...commonSeedFields,
        name: medicine.generic.name,
        normalizedName: medicine.generic.normalizedName,
        aliases: medicine.generic.aliases,
      },
    });

    const existingProduct = await prisma.product.findFirst({
      where: { registrationNumber: medicine.registrationNumber },
    });

    const product = existingProduct
      ? await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            ...commonSeedFields,
            manufacturerId: manufacturer.id,
            brandName: medicine.brandName,
            normalizedBrand: medicine.normalizedBrand,
            displayName: medicine.displayName,
            dosageForm: medicine.dosageForm,
            normalizedForm: medicine.normalizedForm,
            strengthText: medicine.strengthText,
            packSize: medicine.packSize,
            registrationNumber: medicine.registrationNumber,
            signature: medicine.signature,
          },
        })
      : await prisma.product.create({
          data: {
            ...commonSeedFields,
            manufacturerId: manufacturer.id,
            brandName: medicine.brandName,
            normalizedBrand: medicine.normalizedBrand,
            displayName: medicine.displayName,
            dosageForm: medicine.dosageForm,
            normalizedForm: medicine.normalizedForm,
            strengthText: medicine.strengthText,
            packSize: medicine.packSize,
            registrationNumber: medicine.registrationNumber,
            signature: medicine.signature,
          },
        });

    await prisma.productComposition.upsert({
      where: {
        productId_genericId_ingredientOrder: {
          productId: product.id,
          genericId: generic.id,
          ingredientOrder: 1,
        },
      },
      update: {
        ...commonSeedFields,
        strengthValue: medicine.generic.strengthValue,
        strengthUnit: medicine.generic.strengthUnit,
        strengthText: medicine.strengthText,
      },
      create: {
        ...commonSeedFields,
        productId: product.id,
        genericId: generic.id,
        ingredientOrder: 1,
        strengthValue: medicine.generic.strengthValue,
        strengthUnit: medicine.generic.strengthUnit,
        strengthText: medicine.strengthText,
      },
    });

    seededProducts.push({
      id: product.id,
      signature: medicine.signature,
      displayName: medicine.displayName,
    });
  }

  const groups = new Map<string, typeof seededProducts>();
  for (const product of seededProducts) {
    groups.set(product.signature, [...(groups.get(product.signature) ?? []), product]);
  }

  for (const [signature, products] of groups) {
    const existingGroup = await prisma.equivalenceGroup.findFirst({
      where: { signature },
    });
    const group = existingGroup
      ? await prisma.equivalenceGroup.update({
          where: { id: existingGroup.id },
          data: {
            ...commonSeedFields,
            name: `${signature} alternatives`,
            equivalenceType: "same_active_ingredient_strength_form",
            dosageForm: products[0]?.displayName.includes("Tablet") ? "Tablet" : undefined,
          },
        })
      : await prisma.equivalenceGroup.create({
          data: {
            ...commonSeedFields,
            name: `${signature} alternatives`,
            signature,
            equivalenceType: "same_active_ingredient_strength_form",
            dosageForm: products[0]?.displayName.includes("Tablet") ? "Tablet" : undefined,
          },
        });

    for (const product of products) {
      await prisma.productEquivalence.upsert({
        where: {
          productId_equivalenceGroupId: {
            productId: product.id,
            equivalenceGroupId: group.id,
          },
        },
        update: {
          ...commonSeedFields,
          reasonCode: "same_active_ingredient_strength_form",
        },
        create: {
          ...commonSeedFields,
          productId: product.id,
          equivalenceGroupId: group.id,
          reasonCode: "same_active_ingredient_strength_form",
        },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      action: "CREATE",
      entityType: "seed",
      reason: "Closed beta minimal medicine dataset created or refreshed.",
      status: RecordStatus.ACTIVE,
      sourceType: SourceType.SYSTEM,
      confidenceScore: "1.0000",
      metadata: {
        seedDataset: "closed-beta-minimal",
        products: seededProducts.map((product) => product.displayName),
      },
    },
  });

  const manufacturers = await prisma.manufacturer.findMany({ where: { deletedAt: null } });
  for (const m of manufacturers) {
    await prisma.manufacturerMaster.upsert({
      where: { id: deterministicUuid(`manufacturer:${m.normalizedName}`) },
      create: {
        id: deterministicUuid(`manufacturer:${m.normalizedName}`),
        name: m.name,
        normalizedName: m.normalizedName,
        country: m.country,
        status: RecordStatus.VERIFIED,
        sourceType: SourceType.SYSTEM,
        confidenceScore: "0.9500",
        approvalStatus: "APPROVED",
        linkedRegistrations: 1,
        metadata: { seedSource: true },
      },
      update: {
        name: m.name,
        normalizedName: m.normalizedName,
        country: m.country,
      },
    });
  }

  const generics = await prisma.generic.findMany({ where: { deletedAt: null } });
  for (const g of generics) {
    await prisma.ingredientMaster.upsert({
      where: { id: deterministicUuid(`ingredient:${g.normalizedName}`) },
      create: {
        id: deterministicUuid(`ingredient:${g.normalizedName}`),
        name: g.name,
        normalizedName: g.normalizedName,
        status: RecordStatus.VERIFIED,
        sourceType: SourceType.SYSTEM,
        confidenceScore: "0.9500",
        approvalStatus: "APPROVED",
        linkedRegistrations: 1,
        metadata: { seedSource: true },
      },
      update: {
        name: g.name,
        normalizedName: g.normalizedName,
      },
    });
  }

  for (const medicine of medicines) {
    await prisma.dosageFormMaster.upsert({
      where: { id: deterministicUuid(`dosageForm:${medicine.dosageForm}`) },
      create: {
        id: deterministicUuid(`dosageForm:${medicine.dosageForm}`),
        name: medicine.dosageForm,
        normalizedName: medicine.dosageForm.toLowerCase(),
        status: RecordStatus.VERIFIED,
        sourceType: SourceType.SYSTEM,
        confidenceScore: "0.9500",
        approvalStatus: "APPROVED",
        linkedRegistrations: 1,
        metadata: { seedSource: true },
      },
      update: {
        name: medicine.dosageForm,
        normalizedName: medicine.dosageForm.toLowerCase(),
      },
    });

    const packLabel = medicine.packSize.toLowerCase();
    await prisma.packMaster.upsert({
      where: { id: deterministicUuid(`pack:${packLabel}`) },
      create: {
        id: deterministicUuid(`pack:${packLabel}`),
        normalizedPackLabel: packLabel,
        unitCount: 10,
        unitType: "tablet",
        status: RecordStatus.VERIFIED,
        sourceType: SourceType.SYSTEM,
        confidenceScore: "0.9500",
        approvalStatus: "APPROVED",
        linkedRegistrations: 1,
        metadata: { seedSource: true },
      },
      update: {
        normalizedPackLabel: packLabel,
      },
    });

    await prisma.strengthMaster.upsert({
      where: { id: deterministicUuid(`strength:${medicine.strengthText}`) },
      create: {
        id: deterministicUuid(`strength:${medicine.strengthText}`),
        value: medicine.strengthText,
        unit: "mg",
        normalizedValue: medicine.strengthText.toLowerCase(),
        status: RecordStatus.VERIFIED,
        sourceType: SourceType.SYSTEM,
        confidenceScore: "0.9500",
        approvalStatus: "APPROVED",
        linkedRegistrations: 1,
        metadata: { seedSource: true },
      },
      update: {
        value: medicine.strengthText,
        unit: "mg",
        normalizedValue: medicine.strengthText.toLowerCase(),
      },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });

import { strict as assert } from "node:assert";
import { SourceFactory } from "../source.factory";
import { SourceRegistry } from "../source.registry";
import { MockSourceAdapter } from "./mock-source.adapter";

export async function runAdapterValidationTest(): Promise<void> {
  const registry = new SourceRegistry();
  registry.register("mock_pharmacy", MockSourceAdapter);
  const factory = new SourceFactory(registry);
  const adapter = await factory.create("mock_pharmacy", {
    provider: {
      code: "mock_pharmacy",
      name: "Mock Pharmacy",
      providerKind: "ONLINE_PHARMACY",
      adapterVersion: "0.1.0",
      enabled: true,
    },
  });

  const products = await adapter.fetchProducts();
  const prices = await adapter.fetchPrices(products[0]);
  const normalized = await adapter.normalize({ products, prices });
  const validation = await adapter.validate(normalized);
  const health = await adapter.healthCheck();

  assert.equal(products.length, 2);
  assert.equal(normalized.products[0].medicineSignature, "amoxicillin_clavulanic_acid_625mg_tablet");
  assert.equal(validation.valid, true);
  assert.equal(health.healthy, true);
}

describe("MockSourceAdapter", () => {
  it("validates the mock source adapter contract", async () => {
    await runAdapterValidationTest();
  });
});

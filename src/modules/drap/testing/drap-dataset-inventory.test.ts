import { strict as assert } from "node:assert";
import { DrapService } from "../drap.service";

describe("DRAP dataset inventory", () => {
  it("lists the known DRAP dataset files", async () => {
    const service = new DrapService({} as any);
    const inventory = await service.inspectDatasetInventory(process.cwd());

    assert.equal(inventory.length, 2);
    assert.equal(inventory[0].fileName, "src/modules/drap/samples/drap.sample.csv");
    assert.equal(inventory[0].recordCount, 3);
    assert.equal(inventory[1].fileName, "src/modules/matching/testing/matching.dataset.ts");
    assert.equal(inventory[1].recordCount, 4);
  });
});

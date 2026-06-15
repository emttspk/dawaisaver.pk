import { strict as assert } from "node:assert";
import { SearchModule } from "../search.module";
import { searchProducts } from "./search.dataset";

export function runAlternativeSearchTest(): void {
  const service = SearchModule.createService();
  const alternatives = service.alternatives("canonical-augmentin", searchProducts);

  assert.equal(alternatives?.canonicalProduct.brandName, "Augmentin");
  assert.ok(alternatives?.equivalentBrands.some((item) => item.brandName === "Moxclav"));
  assert.equal(alternatives?.priceStatistics?.lowestPrice, 310);
}

describe("Alternative search", () => {
  it("returns equivalent brands and price statistics", () => {
    runAlternativeSearchTest();
  });
});

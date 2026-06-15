import { strict as assert } from "node:assert";
import { SearchModule } from "../search.module";
import {
  searchPopularity,
  searchProducts,
} from "./search.dataset";

export function runRankingTest(): void {
  const service = SearchModule.createService();
  const results = service.searchProducts({ q: "Augmentin" }, searchProducts, searchPopularity);
  const generic = service.searchGenerics({ q: "esomeprazole" }, searchProducts);

  assert.equal(results[0].brandName, "Augmentin");
  assert.ok(results[0].rankingFactors.exactBrandMatch === 1);
  assert.equal(generic[0].brandName, "Nexum");
}

describe("Search ranking", () => {
  it("prioritizes exact brand and generic matches", () => {
    runRankingTest();
  });
});

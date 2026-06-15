import { strict as assert } from "node:assert";
import { SearchModule } from "../search.module";
import {
  searchPopularity,
  searchProducts,
  searchSynonyms,
} from "./search.dataset";

export function runAutocompleteTest(): void {
  const service = SearchModule.createService();
  const prefix = service.autocomplete({ q: "aug" }, searchProducts, searchSynonyms, searchPopularity);
  const typo = service.autocomplete({ q: "agmentin" }, searchProducts, searchSynonyms, searchPopularity);
  const synonym = service.autocomplete({ q: "co amox" }, searchProducts, searchSynonyms, searchPopularity);

  assert.equal(prefix[0].suggestion, "Augmentin");
  assert.ok(typo.some((item) => item.suggestion === "Augmentin"));
  assert.ok(synonym.some((item) => item.suggestion === "co-amoxiclav"));
}

describe("Search autocomplete", () => {
  it("supports prefix, typo, synonym, and popularity signals", () => {
    runAutocompleteTest();
  });
});

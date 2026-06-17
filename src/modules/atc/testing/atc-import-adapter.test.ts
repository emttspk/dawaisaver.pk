import { strict as assert } from "node:assert";
import { AtcImportAdapter } from "../atc.import-adapter";

describe("ATC import adapter", () => {
  it("parses WHO CSV rows", () => {
    const adapter = new AtcImportAdapter();
    const rows = adapter.parsePayload(
      "csv",
      [
        "atc_code,atc_name,ddd,uom,adm_r,note",
        "A,ALIMENTARY TRACT AND METABOLISM,NA,NA,NA,NA",
        "A01AA01,sodium fluoride,1.1,mg,O,0.5 mg fluoride",
      ].join("\n"),
    );

    assert.equal(rows.length, 2);
    assert.equal(rows[0].atcCode, "A");
    assert.equal(rows[0].atcName, "ALIMENTARY TRACT AND METABOLISM");
    assert.equal(rows[1].atcCode, "A01AA01");
    assert.equal(rows[1].atcName, "sodium fluoride");
  });
});

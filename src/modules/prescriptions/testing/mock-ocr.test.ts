import { strict as assert } from "node:assert";
import { OcrModule } from "../../ocr/ocr.module";

describe("Mock OCR provider", () => {
  it("returns deterministic text for mock uploads", async () => {
    const ocr = OcrModule.createService();
    const result = await ocr.extractText({
      imageReference: "r2://prescriptions/sample-rx-1.jpg",
      mockText: "Augmentin 625mg tablet",
    });

    assert.equal(result.providerName, "mock-ocr");
    assert.equal(result.text, "Augmentin 625mg tablet");
    assert.ok(result.confidenceScore > 0);
  });
});


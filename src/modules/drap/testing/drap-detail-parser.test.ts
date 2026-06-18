import { strict as assert } from "node:assert";
import { buildRawHtmlObjectKey, parseDrapMirrorPage } from "../drap.detail-parser";

describe("DRAP detail parser", () => {
  it("extracts the live DRAP detail fields from the product page structure", () => {
    const html = `<!DOCTYPE html>
<html>
<body>
  <div class="card-body d-flex align-items-center gap-3">
    <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 bg-success text-white fs-3 fw-bold">A</div>
    <div>
      <h5 class="mb-2 fw-semibold">Amoxi-Clav 625mg Tablet</h5>
      <div class="d-flex flex-wrap gap-2">
        <span class="badge bg-secondary-subtle text-secondary fw-semibold">Reg # 031356</span>
        <span class="badge bg-danger-subtle text-danger fw-semibold">Cancelled</span>
        <span class="badge bg-primary-subtle text-primary fw-semibold">Approved / Verified</span>
        <span class="badge bg-info-subtle text-info fw-semibold">Pharmaceutical</span>
      </div>
    </div>
  </div>
  <!-- Tab Nav -->
  <div class="tab-panel" id="tab-general">
    <div class="card border shadow-sm mb-3">
      <div class="card-header bg-light border-bottom">
        <h6 class="mb-0 text-success">General Information</h6>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-6 col-md-3">
            <div class="small text-muted text-uppercase fw-semibold">Brand Name</div>
            <div class="mt-1">Amoxi-Clav 625mg Tablet</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="small text-muted text-uppercase fw-semibold">Registration No</div>
            <div class="mt-1">031356</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="small text-muted text-uppercase fw-semibold">Registration Date</div>
            <div class="mt-1">2009-04-28</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="small text-muted text-uppercase fw-semibold">Meeting No</div>
            <div class="mt-1">213</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="small text-muted text-uppercase fw-semibold">Dosage Form</div>
            <div class="mt-1">Tablet</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="small text-muted text-uppercase fw-semibold">Product Category</div>
            <div class="mt-1">Pharmaceutical</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="small text-muted text-uppercase fw-semibold">Route of Admin</div>
            <div class="mt-1">oral</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="small text-muted text-uppercase fw-semibold">Manufacturing Type</div>
            <div class="mt-1">Self Manufacturing</div>
          </div>
          <div class="col-6 col-md-3">
            <div class="small text-muted text-uppercase fw-semibold">Country</div>
            <div class="mt-1">Pakistan</div>
          </div>
        </div>
        <hr class="my-3">
        <div class="small text-muted text-uppercase fw-semibold mb-1">Label Claim (Ref Unit)</div>
        <p class="mb-0">Each film coated tablet contains:&lt;br&gt;Amoxicillin (as Trihydrate).........500mgmg&lt;br&gt;Clavulanic Acid (as Potassium).........125mg</p>
      </div>
    </div>
    <div class="card border shadow-sm mb-3">
      <div class="card-header bg-light border-bottom">
        <h6 class="mb-0 text-success">Composition</h6>
      </div>
      <div class="table-responsive">
        <table class="table table-sm table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Generic Name</th><th>Operator</th><th>Strength</th><th>Unit</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Amoxicillin (as trihydrate)</td><td><code>+</code></td><td>500</td><td>mg</td></tr>
            <tr><td>Clavulanic Acid as Potassium</td><td><code>+</code></td><td>125</td><td>mg</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card border shadow-sm mb-3">
      <div class="card-header bg-light border-bottom">
        <h6 class="mb-0 text-success">Pack Size & Pricing</h6>
      </div>
      <div class="table-responsive">
        <table class="table table-sm table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Pack Size</th><th>Presentation</th><th>Approved Price</th><th>Pricing Type</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Nil</td><td>Nil</td><td>As per SRO</td><td>As per SRO</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="card border shadow-sm mb-3">
      <div class="card-header bg-light border-bottom">
        <h6 class="mb-0 text-success">Remarks</h6>
      </div>
      <div class="card-body">
        <div class="mb-3">
          <div class="small text-muted text-uppercase fw-semibold mb-1">Data Deficiency Remarks</div>
          <p class="mb-0">update_1.0;update_1.0</p>
        </div>
        <div>
          <div class="small text-muted text-uppercase fw-semibold mb-1">Approval Letter Remarks</div>
          <p class="mb-0">Cancelled on 19th December, 2023 (M-320)</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const parsed = parseDrapMirrorPage(html, "https://eapp.dra.gov.pk/product_view_web.php?reg_no=031356");

    assert.equal(parsed.registrationNumber, "031356");
    assert.equal(parsed.brandName, "Amoxi-Clav 625mg Tablet");
    assert.equal(parsed.registrationDate, "2009-04-28");
    assert.equal(parsed.meetingNumber, "213");
    assert.equal(parsed.dosageForm, "Tablet");
    assert.equal(parsed.category, "Pharmaceutical");
    assert.equal(parsed.country, "Pakistan");
    assert.equal(parsed.manufacturingType, "Self Manufacturing");
    assert.equal(parsed.compositionRows.length, 2);
    assert.equal(parsed.compositionRows[0].genericName, "Amoxicillin (as trihydrate)");
    assert.equal(parsed.compositionRows[0].strength, "500");
    assert.equal(parsed.compositionRows[0].unit, "mg");
    assert.equal(parsed.packSize, "Nil");
    assert.equal(parsed.approvedPrice, "As per SRO");
    assert.equal(parsed.pricingType, "As per SRO");
    assert.ok(parsed.remarks?.some((remark) => remark.includes("Cancelled on 19th December, 2023")));
    assert.equal(parsed.rawHtmlUrl, "https://eapp.dra.gov.pk/product_view_web.php?reg_no=031356");
  });

  it("builds deterministic R2 raw HTML keys", () => {
    const keyA = buildRawHtmlObjectKey("031356", "<html>a</html>");
    const keyB = buildRawHtmlObjectKey("031356", "<html>a</html>");
    const keyC = buildRawHtmlObjectKey("031356", "<html>b</html>");

    assert.equal(keyA, keyB);
    assert.notEqual(keyA, keyC);
    assert.ok(keyA.startsWith("drap/raw/031356/"));
  });
});

import { createHash } from "node:crypto";
import { DrapMirrorCompositionRow, DrapMirrorParsedRecord } from "./drap.types";

export function parseDrapMirrorPage(html: string, sourceUrl?: string): DrapMirrorParsedRecord {
  const normalizedHtml = normalizeHtml(html);
  const headerSection = extractBetween(
    normalizedHtml,
    '<div class="card-body d-flex align-items-center gap-3">',
    "<!-- Tab Nav -->",
  );

  if (!headerSection || !/Reg\s*#/i.test(headerSection)) {
    throw new Error("DRAP product detail page does not contain a product record.");
  }

  const generalSection = extractSectionByHeading(normalizedHtml, "General Information");
  const compositionSection = extractSectionByHeading(normalizedHtml, "Composition");
  const pricingSection = extractSectionByHeading(normalizedHtml, "Pack Size & Pricing");
  const remarksSection = extractSectionByHeading(normalizedHtml, "Remarks");

  const headerTitle = firstTextMatch(
    headerSection,
    /<h5[^>]*class="mb-2 fw-semibold"[^>]*>([\s\S]*?)<\/h5>/i,
  );
  const headerBadges = extractHeaderBadges(headerSection);
  const generalFields = extractLabeledGrid(generalSection);
  const labelClaim = firstTextMatch(
    generalSection,
    /Label Claim\s*\(Ref Unit\)<\/div>\s*<p[^>]*>([\s\S]*?)<\/p>/i,
  );
  const compositionRows = parseCompositionRows(compositionSection);
  const pricingRow = parsePricingRow(pricingSection);
  const remarks = extractRemarks(remarksSection);

  const registrationNumber =
    lookupField(generalFields, ["Registration No"]) ||
    firstTextMatch(headerSection, /Reg\s*#\s*([A-Za-z0-9\-\s./]+)<\/span>/i) ||
    firstTextMatch(normalizedHtml, /name="reg_no"[\s\S]*?value="([^"]*)"/i) ||
    "";

  const record: DrapMirrorParsedRecord = {
    registrationNumber: cleanText(registrationNumber),
    brandName: cleanText(
      lookupField(generalFields, ["Brand Name"]) || headerTitle || undefined,
    ) || undefined,
    registrationDate: cleanText(lookupField(generalFields, ["Registration Date"])) || undefined,
    meetingNumber: cleanText(lookupField(generalFields, ["Meeting No"])) || undefined,
    dosageForm: cleanText(lookupField(generalFields, ["Dosage Form"])) || undefined,
    compositionRows,
    packSize: cleanText(pricingRow.packSize) || undefined,
    approvedPrice: cleanText(pricingRow.approvedPrice) || undefined,
    pricingType: cleanText(pricingRow.pricingType) || undefined,
    manufacturer:
      cleanText(
        lookupField(generalFields, ["Manufacturer", "Manufacturer Name", "Company Name"]),
      ) || undefined,
    companyAddress:
      cleanText(
        lookupField(generalFields, ["Company Address", "Address"]),
      ) || undefined,
    country: cleanText(lookupField(generalFields, ["Country", "Country of Origin"])) || undefined,
    manufacturingType: cleanText(lookupField(generalFields, ["Manufacturing Type"])) || undefined,
    category:
      cleanText(lookupField(generalFields, ["Product Category"])) ||
      detectCategory(headerBadges) ||
      undefined,
    sourceStatus: detectRegistrationStatus(headerBadges) || undefined,
    sourceVerificationStatus: detectVerificationStatus(headerBadges) || undefined,
    routeOfAdmin: cleanText(lookupField(generalFields, ["Route of Admin", "Route of Administration"])) || undefined,
    labelClaim: cleanText(labelClaim) || undefined,
    activeIngredient: cleanText(lookupField(generalFields, ["Active Ingredient", "Active Ingredients"])) || undefined,
    dosage: cleanText(lookupField(generalFields, ["Dosage", "Dose", "Dosage/Strength"])) || undefined,
    packageType: cleanText(lookupField(generalFields, ["Package Type", "Packaging Type"])) || undefined,
    therapeuticCategory: cleanText(lookupField(generalFields, ["Therapeutic Category", "Therapeutic Class"])) || undefined,
    atcCode: cleanText(lookupField(generalFields, ["ATC Code", "ATC Classification"])) || undefined,
    indications: cleanText(lookupField(generalFields, ["Indications", "Indication"])) || undefined,
    contraindications: cleanText(lookupField(generalFields, ["Contraindications", "Contraindication"])) || undefined,
    sideEffects: cleanText(lookupField(generalFields, ["Side Effects", "Adverse Effects", "Adverse Reactions"])) || undefined,
    drugInteractions: cleanText(lookupField(generalFields, ["Drug Interactions", "Interactions"])) || undefined,
    precautions: cleanText(lookupField(generalFields, ["Precautions", "Precaution"])) || undefined,
    warnings: cleanText(lookupField(generalFields, ["Warnings", "Warning"])) || undefined,
    shelfLife: cleanText(lookupField(generalFields, ["Shelf Life", "Shelf Life (Months)"])) || undefined,
    storageCondition: cleanText(lookupField(generalFields, ["Storage Condition", "Storage Conditions", "Storage"])) || undefined,
    remarks,
    rawHtmlUrl: sourceUrl,
  };

  if (!record.registrationNumber) {
    throw new Error("Unable to extract registration number from DRAP detail page.");
  }

  return record;
}

export function canonicalizeRegistrationNumber(value: string): string {
  return String(value || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function buildRawHtmlObjectKey(registrationNumber: string, html: string): string {
  const canonical = canonicalizeRegistrationNumber(registrationNumber);
  const folder = `drap/raw/${canonicalizePathSegment(canonical)}`;
  const hash = sha256Hex(html).slice(0, 16);
  return `${folder}/${hash}.html`;
}

function extractSectionByHeading(html: string, heading: string): string {
  const headingPattern = new RegExp(`<h6[^>]*>\\s*${escapeRegex(heading)}\\s*<\\/h6>`, "i");
  const match = headingPattern.exec(html);
  if (!match || match.index === undefined) {
    return "";
  }

  const slice = html.slice(match.index);
  const nextSectionIndex = slice.search(/<!--/);
  return nextSectionIndex > 0 ? slice.slice(0, nextSectionIndex) : slice;
}

function extractBetween(html: string, startToken: string, endToken: string): string {
  const start = html.indexOf(startToken);
  if (start < 0) {
    return "";
  }

  const slice = html.slice(start + startToken.length);
  const end = slice.indexOf(endToken);
  return end >= 0 ? slice.slice(0, end) : slice;
}

function extractLabeledGrid(section: string): Record<string, string> {
  if (!section) {
    return {};
  }

  const extractWithPattern = (pattern: RegExp): Array<[string, string]> =>
    Array.from(section.matchAll(pattern))
      .map((m) => [cleanText(stripTags(m[1])), cleanText(stripTags(m[2]))] as [string, string])
      .filter(([label, value]) => label.length > 0 && value.length > 0);

  const mergeFields = (acc: Record<string, string>, [label, value]: [string, string]): Record<string, string> => ({
    ...acc,
    [normalizeLabel(label)]: value,
  });

  const patterns: RegExp[] = [
    /<div class="small[^"]*">([\s\S]*?)<\/div>\s*<div class="mt-1"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div class="col-sm-4[^"]*">([\s\S]*?)<\/div>\s*<div class="col-sm-8[^"]*">([\s\S]*?)<\/div>/gi,
    /<div class="col-md-4[^"]*">([\s\S]*?)<\/div>\s*<div class="col-md-8[^"]*">([\s\S]*?)<\/div>/gi,
    /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi,
    /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi,
  ];

  const allPairs: Array<[string, string]> = patterns.flatMap(extractWithPattern);

  const dedup = allPairs.reduce<Record<string, string>>((acc, [label, value]) => {
    const key = normalizeLabel(label);
    if (!acc[key]) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const result = Object.entries(dedup).reduce<Record<string, string>>((acc, [key, value]) => {
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});

  return result;
}

function lookupField(fields: Record<string, string>, labels: string[]): string | undefined {
  for (const label of labels) {
    const normalized = normalizeLabel(label);
    if (fields[normalized]) {
      return fields[normalized];
    }
  }
  return undefined;
}

function parseCompositionRows(section: string): DrapMirrorCompositionRow[] {
  const tbodyMatch = section.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) {
    return [];
  }

  const rows = Array.from(tbodyMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi));
  return rows
    .map((row) => {
      const cells = Array.from(row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map((cell) =>
        cleanText(stripTags(cell[1])),
      );

      if (cells.length === 0 || cells.every((cell) => !cell)) {
        return undefined;
      }

      return {
        genericName: cells[0] || "",
        operator: cells[1] || undefined,
        strength: cells[2] || undefined,
        unit: cells[3] || undefined,
      };
    })
    .filter(Boolean) as DrapMirrorCompositionRow[];
}

function parsePricingRow(section: string): {
  packSize?: string;
  approvedPrice?: string;
  pricingType?: string;
} {
  const tbodyMatch = section.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) {
    return {};
  }

  const rowMatch = tbodyMatch[1].match(/<tr>([\s\S]*?)<\/tr>/i);
  if (!rowMatch) {
    return {};
  }

  const cells = Array.from(rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map((cell) =>
    cleanText(stripTags(cell[1])),
  );

  return {
    packSize: cells[0] || undefined,
    approvedPrice: cells[2] || undefined,
    pricingType: cells[3] || undefined,
  };
}

function extractRemarks(section: string): string[] {
  if (!section) {
    return [];
  }

  const remarks: string[] = [];
  const matches = Array.from(
    section.matchAll(
      /<div class="small[^"]*">\s*([\s\S]*?)\s*<\/div>\s*<p[^>]*>([\s\S]*?)<\/p>/gi,
    ),
  );

  for (const match of matches) {
    const label = cleanText(stripTags(match[1]));
    const value = cleanText(stripTags(match[2]));
    if (label && value) {
      remarks.push(`${label}: ${value}`);
    }
  }

  return remarks;
}

function firstTextMatch(input: string, pattern: RegExp): string | undefined {
  const match = input.match(pattern);
  if (!match) {
    return undefined;
  }

  return cleanText(stripTags(match[1]));
}

function extractHeaderBadges(section: string): string[] {
  return Array.from(section.matchAll(/<span class="badge[^"]*">([\s\S]*?)<\/span>/gi))
    .map((match) => cleanText(stripTags(match[1])))
    .filter(Boolean);
}

function detectRegistrationStatus(badges: string[]): string | undefined {
  return badges.find((badge) => /cancelled|active|expired|archived/i.test(badge));
}

function detectVerificationStatus(badges: string[]): string | undefined {
  return badges.find((badge) => /verified|not verified|pending/i.test(badge));
}

function detectCategory(badges: string[]): string | undefined {
  return badges.find((badge) => /pharmaceutical|veterinary|biological|medical device/i.test(badge));
}

function normalizeLabel(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value: string): string {
  return htmlFragmentToText(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function htmlFragmentToText(value: string): string {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&#039;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(value?: string): string {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHtml(html: string): string {
  return String(html || "").replace(/^\uFEFF/, "");
}

function canonicalizePathSegment(value: string): string {
  return cleanText(value)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "registration";
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

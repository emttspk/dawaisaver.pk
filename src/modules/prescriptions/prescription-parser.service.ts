import { PrescriptionProcessingInput, PrescriptionRawLine } from "./prescription.types";

const DOSAGE_PATTERN = /\b(\d+(?:\.\d+)?)\s?(mcg|mg|g|iu|u|ml|%|mL)\b/i;
const QUANTITY_PATTERN = /\b(x|take|tab(?:let)?s?|cap(?:sule)?s?|syp|syrup|inj|drop(?:s)?|puff(?:s)?)\s*(\d+(?:\.\d+)?)\b/i;
const FORM_PATTERN = /\b(tablet|tab|capsule|cap|syrup|suspension|cream|ointment|injection|drop|drops|gel|solution|spray)\b/i;

export class PrescriptionParserService {
  parse(input: PrescriptionProcessingInput): { rawText: string; lines: PrescriptionRawLine[] } {
    const rawText = this.selectText(input);
    const lines = rawText
      .split(/\r?\n|;|•|·/g)
      .map((line, index) => this.parseLine(line, index + 1))
      .filter((line): line is PrescriptionRawLine => Boolean(line));

    return { rawText, lines };
  }

  extractRawLines(text: string): PrescriptionRawLine[] {
    return text
      .split(/\r?\n|;|•|·/g)
      .map((line, index) => this.parseLine(line, index + 1))
      .filter((line): line is PrescriptionRawLine => Boolean(line));
  }

  private selectText(input: PrescriptionProcessingInput): string {
    return String(input.ocrText || input.manualText || (input as any).text || input.imageReference || "").trim();
  }

  private parseLine(line: string, lineNumber: number): PrescriptionRawLine | undefined {
    const rawText = String(line || "").trim();
    if (!rawText) {
      return undefined;
    }

    const normalizedText = normalizeText(rawText);
    const dosageMatch = rawText.match(DOSAGE_PATTERN);
    const quantityMatch = rawText.match(QUANTITY_PATTERN);
    const parsedName = normalizeMedicineName(rawText, dosageMatch?.[0], quantityMatch?.[0]);
    const confidenceScore = calculateConfidence(rawText, parsedName, dosageMatch, quantityMatch);

    return {
      lineNumber,
      rawText,
      normalizedText,
      parsedName,
      dosageText: dosageMatch?.[0],
      quantity: quantityMatch ? Number(quantityMatch[2]) : undefined,
      confidenceScore,
    };
  }
}

export function normalizeText(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[^a-z0-9%+\s-]/g, " ")
    .replace(/[_+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeMedicineName(rawText: string, dosageText?: string, quantityText?: string): string {
  let value = rawText;
  if (dosageText) {
    value = value.replace(dosageText, " ");
  }
  if (quantityText) {
    value = value.replace(quantityText, " ");
  }

  value = value.replace(FORM_PATTERN, " ");
  value = value.replace(/\b(once|daily|twice|bd|tds|qid|hs|morning|night|after|before|meal|meals)\b/gi, " ");

  return normalizeText(value).replace(/\s+/g, " ");
}

function calculateConfidence(
  rawText: string,
  parsedName: string,
  dosageMatch: RegExpMatchArray | null,
  quantityMatch: RegExpMatchArray | null,
): number {
  let confidence = 0.32;
  if (parsedName.length >= 4) {
    confidence += 0.28;
  }
  if (dosageMatch) {
    confidence += 0.2;
  }
  if (quantityMatch) {
    confidence += 0.08;
  }
  if (/[a-z]/i.test(rawText) && /\d/.test(rawText)) {
    confidence += 0.1;
  }
  return Math.min(1, Number(confidence.toFixed(4)));
}

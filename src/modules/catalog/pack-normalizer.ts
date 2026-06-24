import { NormalizedPack, PackUnitType } from "./catalog.types";

const UNIT_TYPE_MAP: Record<string, PackUnitType> = {
  tablet: "TABLET",
  tablets: "TABLET",
  tab: "TABLET",
  cap: "CAPSULE",
  capsules: "CAPSULE",
  capsule: "CAPSULE",
  syrup: "SYRUP",
  suspension: "SUSPENSION",
  drops: "DROPS",
  drop: "DROPS",
  cream: "CREAM",
  ointment: "OINTMENT",
  injection: "INJECTION",
  inj: "INJECTION",
  ampoule: "AMPOULE",
  ampules: "AMPOULE",
  amp: "AMPOULE",
  vial: "VIAL",
  vials: "VIAL",
  inhaler: "INHALER",
  strip: "STRIP",
  strips: "STRIP",
  s: "STRIP",
  bottle: "BOTTLE",
  bottles: "BOTTLE",
  pack: "PACK",
  packs: "PACK",
};

const VOLUME_PATTERN = /(\d+(?:\.\d+)?)\s*(ml|millilitre|milliliter|mL|mL)/gi;
const WEIGHT_PATTERN = /(\d+(?:\.\d+)?)\s*(g|gram|grams|gm|kg|kilogram|kg)/gi;
const NUMBER_PATTERN = /(\d+)/g;

export function normalizePack(packSize: string | undefined | null): NormalizedPack | undefined {
  if (!packSize || !packSize.trim()) {
    return undefined;
  }

  const normalized = packSize.trim().toLowerCase();

  const unitType = detectUnitType(normalized);
  const unitCount = extractUnitCount(normalized);
  const volumeMl = extractVolume(normalized);
  const weightG = extractWeight(normalized);
  const containerCount = extractContainerCount(normalized);

  if (!unitType || unitCount === 0) {
    return undefined;
  }

  const normalizedPackLabel = buildNormalizedLabel(unitCount, unitType, volumeMl, weightG, containerCount);

  return {
    unitCount,
    unitType,
    volumeMl,
    weightG,
    containerCount,
    normalizedPackLabel,
  };
}

function detectUnitType(packSize: string): string {
  for (const [key, value] of Object.entries(UNIT_TYPE_MAP)) {
    if (packSize.includes(key)) {
      return value;
    }
  }
  return "OTHER";
}

function extractUnitCount(packSize: string): number {
  const numbers = Array.from(packSize.matchAll(NUMBER_PATTERN));
  if (numbers.length === 0) {
    return 0;
  }

  const firstNumber = parseInt(numbers[0][1], 10);
  if (packSize.includes("strip") || packSize.includes("s ")) {
    return firstNumber;
  }
  if (packSize.includes("bottle") || packSize.includes("bottles")) {
    return firstNumber;
  }
  if (packSize.includes("tablet") || packSize.includes("tab")) {
    return firstNumber;
  }
  if (packSize.includes("capsule") || packSize.includes("cap")) {
    return firstNumber;
  }
  if (packSize.includes("ml") || packSize.includes("millilitre") || packSize.includes("milliliter")) {
    return firstNumber;
  }

  return firstNumber;
}

function extractVolume(packSize: string): number | undefined {
  const match = packSize.match(VOLUME_PATTERN);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return undefined;
}

function extractWeight(packSize: string): number | undefined {
  const match = packSize.match(WEIGHT_PATTERN);
  if (match && match[1]) {
    const value = parseFloat(match[1]);
    if (match[2]?.toLowerCase()?.startsWith("kg")) {
      return value * 1000;
    }
    return value;
  }
  return undefined;
}

function extractContainerCount(packSize: string): number {
  if (packSize.includes("bottle")) {
    return 1;
  }
  if (packSize.includes("strip")) {
    return 1;
  }
  if (packSize.includes("pack")) {
    return 1;
  }
  return 1;
}

function buildNormalizedLabel(
  unitCount: number,
  unitType: string,
  volumeMl?: number,
  weightG?: number,
  containerCount?: number,
): string {
  const parts: string[] = [];

  if (unitCount > 0) {
    parts.push(`${unitCount}${unitType.toLowerCase()}`);
  }

  if (volumeMl) {
    parts.push(`${volumeMl}ml`);
  }

  if (weightG) {
    parts.push(`${weightG}g`);
  }

  return parts.join(" ");
}

export function analyzePackInventory(packs: Array<string | undefined | null>): {
  total: number;
  parseable: number;
  unparseable: number;
  byUnitType: Record<string, number>;
  samplePatterns: string[];
} {
  const total = packs.length;
  let parseable = 0;
  let unparseable = 0;
  const byUnitType: Record<string, number> = {};
  const samplePatterns: string[] = [];

  for (const pack of packs) {
    const normalized = normalizePack(pack);
    if (normalized) {
      parseable++;
      byUnitType[normalized.unitType] = (byUnitType[normalized.unitType] || 0) + 1;
      if (samplePatterns.length < 20) {
        samplePatterns.push(`${pack} → ${normalized.normalizedPackLabel}`);
      }
    } else if (pack && pack.trim()) {
      unparseable++;
      if (samplePatterns.length < 20) {
        samplePatterns.push(`${pack} → UNPARSEABLE`);
      }
    }
  }

  return { total, parseable, unparseable, byUnitType, samplePatterns };
}
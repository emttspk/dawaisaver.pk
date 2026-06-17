import { Injectable } from "@nestjs/common";
import {
  MoleculeAliasSeed,
  MoleculeNormalizationReport,
  MoleculeNormalizationResult,
} from "./atc.types";

interface MoleculeRule {
  canonicalName: string;
  aliases: Array<{ name: string; confidenceScore: number }>;
  matchReason: string;
}

const CURATED_RULES = new Map<string, MoleculeRule>([
  [
    normalizeKey("Vitamin D3"),
    {
      canonicalName: "Cholecalciferol",
      aliases: [
        { name: "Vitamin D3", confidenceScore: 1 },
        { name: "Cholecalciferol", confidenceScore: 1 },
        { name: "Colecalciferol", confidenceScore: 0.98 },
      ],
      matchReason: "curated-synonym",
    },
  ],
  [
    normalizeKey("Acetaminophen"),
    {
      canonicalName: "Paracetamol",
      aliases: [
        { name: "Acetaminophen", confidenceScore: 1 },
        { name: "Paracetamol", confidenceScore: 1 },
      ],
      matchReason: "curated-synonym",
    },
  ],
  [
    normalizeKey("Co-Amoxiclav"),
    {
      canonicalName: "Amoxicillin + Clavulanic Acid",
      aliases: [
        { name: "Co-Amoxiclav", confidenceScore: 1 },
        { name: "Amoxicillin + Clavulanic Acid", confidenceScore: 1 },
        { name: "Amoxicillin/Clavulanic Acid", confidenceScore: 0.98 },
      ],
      matchReason: "curated-combination",
    },
  ],
]);

@Injectable()
export class MoleculeNormalizationService {
  normalize(sourceName: string): MoleculeNormalizationResult {
    const cleanSourceName = cleanText(sourceName);
    const normalizedGenericName = normalizeGenericName(cleanSourceName);
    const key = normalizeKey(cleanSourceName);
    const rule = CURATED_RULES.get(key);

    if (rule) {
      return {
        sourceName: cleanSourceName,
        normalizedGenericName: normalizeGenericName(rule.canonicalName),
        canonicalName: rule.canonicalName,
        canonicalKey: normalizeKey(rule.canonicalName),
        aliases: this.buildAliasSeeds(cleanSourceName, rule.canonicalName, rule.aliases),
        matched: true,
        matchReason: rule.matchReason,
      };
    }

    const canonicalName = this.toCanonicalName(cleanSourceName);
    const canonicalKey = normalizeKey(canonicalName);
    const aliases = this.buildAliasSeeds(cleanSourceName, canonicalName, [
      { name: cleanSourceName, confidenceScore: 1 },
      { name: canonicalName, confidenceScore: 0.95 },
    ]);

    return {
      sourceName: cleanSourceName,
      normalizedGenericName,
      canonicalName,
      canonicalKey,
      aliases,
      matched: canonicalKey === normalizedGenericName,
      matchReason: canonicalKey === normalizedGenericName ? "direct-canonical" : "heuristic-titlecase",
    };
  }

  buildReport(
    results: MoleculeNormalizationResult[],
    orphanAtcEntries: string[],
  ): MoleculeNormalizationReport {
    const duplicateGroups = new Map<
      string,
      { canonicalName: string; sourceNames: Set<string> }
    >();

    for (const result of results) {
      if (!duplicateGroups.has(result.canonicalKey)) {
        duplicateGroups.set(result.canonicalKey, {
          canonicalName: result.canonicalName,
          sourceNames: new Set<string>(),
        });
      }

      duplicateGroups.get(result.canonicalKey)!.sourceNames.add(result.sourceName);
    }

    const duplicateMolecules = Array.from(duplicateGroups.values())
      .filter((group) => group.sourceNames.size > 1)
      .map((group) => ({
        canonicalName: group.canonicalName,
        sourceNames: Array.from(group.sourceNames).sort(),
      }))
      .sort((left, right) => left.canonicalName.localeCompare(right.canonicalName));

    const spellingVariants = results
      .filter((result) => result.sourceName.toLowerCase() !== result.canonicalName.toLowerCase())
      .map((result) => ({
        sourceName: result.sourceName,
        canonicalName: result.canonicalName,
        normalizedGenericName: result.normalizedGenericName,
      }))
      .sort((left, right) => left.sourceName.localeCompare(right.sourceName));

    const unmatchedSubstances = results
      .filter((result) => !result.matched)
      .map((result) => result.sourceName)
      .sort((left, right) => left.localeCompare(right));

    return {
      duplicateMolecules,
      spellingVariants,
      unmatchedSubstances,
      orphanAtcEntries: [...new Set(orphanAtcEntries)].sort((left, right) => left.localeCompare(right)),
    };
  }

  private buildAliasSeeds(
    sourceName: string,
    canonicalName: string,
    curatedAliases: Array<{ name: string; confidenceScore: number }>,
  ): MoleculeAliasSeed[] {
    const aliases = new Map<string, MoleculeAliasSeed>();

    const addAlias = (aliasName: string, aliasType: string, confidenceScore: number) => {
      const normalizedAliasName = normalizeGenericName(aliasName);
      const key = `${normalizedAliasName}:${aliasType}`;

      if (!normalizedAliasName || aliases.has(key)) {
        return;
      }

      aliases.set(key, {
        aliasName: cleanText(aliasName),
        normalizedAliasName,
        aliasType,
        confidenceScore,
      });
    };

    addAlias(sourceName, "SOURCE_NAME", 1);
    addAlias(normalizeGenericName(sourceName), "NORMALIZED_SOURCE", 0.98);
    addAlias(canonicalName, "CANONICAL_NAME", 1);
    addAlias(normalizeGenericName(canonicalName), "NORMALIZED_CANONICAL", 1);

    for (const alias of curatedAliases) {
      addAlias(alias.name, "CURATED_ALIAS", alias.confidenceScore);
    }

    return Array.from(aliases.values());
  }

  private toCanonicalName(sourceName: string): string {
    const text = cleanText(sourceName)
      .replace(/\s*([+/&])\s*/g, " $1 ")
      .replace(/\band\b/gi, " + ")
      .replace(/\s+/g, " ")
      .trim();

    if (!text) {
      return "";
    }

    if (text.includes("+")) {
      return text
        .split("+")
        .map((part) => this.titleCase(part))
        .filter(Boolean)
        .join(" + ");
    }

    return this.titleCase(text);
  }

  private titleCase(value: string): string {
    return value
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const lower = word.toLowerCase();
        if (lower === "and") {
          return "and";
        }

        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(" ");
  }

}

export function normalizeGenericName(value?: string): string {
  return normalizeKey(value)
    .replace(/\s*\+\s*/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeKey(value?: string): string {
  return cleanText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value?: string): string {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

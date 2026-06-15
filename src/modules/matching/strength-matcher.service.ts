export class StrengthMatcherService {
  matchStrength(source?: string, canonical?: string): number {
    if (!source || !canonical) {
      return 0;
    }
    if (source === canonical) {
      return 1;
    }

    const parsedSource = parseStrength(source);
    const parsedCanonical = parseStrength(canonical);
    if (!parsedSource || !parsedCanonical || parsedSource.unit !== parsedCanonical.unit) {
      return 0;
    }

    const difference = Math.abs(parsedSource.value - parsedCanonical.value);
    const scale = Math.max(parsedSource.value, parsedCanonical.value);
    return Math.max(0, Math.round((1 - difference / scale) * 10000) / 10000);
  }
}

function parseStrength(value: string): { value: number; unit: string } | undefined {
  const match = value.match(/([0-9]+(?:\.[0-9]+)?)\s*(mg|mcg|g|ml|iu|%)/i);
  if (!match) {
    return undefined;
  }

  return {
    value: Number(match[1]),
    unit: match[2].toLowerCase(),
  };
}


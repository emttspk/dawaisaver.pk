export class BrandMatcherService {
  matchBrand(source?: string, canonical?: string): number {
    return textSimilarity(source, canonical);
  }
}

export function textSimilarity(a?: string, b?: string): number {
  const left = String(a || "").trim();
  const right = String(b || "").trim();
  if (!left && !right) {
    return 0;
  }
  if (left === right) {
    return 1;
  }
  if (!left || !right) {
    return 0;
  }

  const leftTokens = new Set(left.split(/\s+/).filter(Boolean));
  const rightTokens = new Set(right.split(/\s+/).filter(Boolean));
  const intersection = Array.from(leftTokens).filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  const tokenScore = union === 0 ? 0 : intersection / union;
  const distanceScore = 1 - levenshtein(left, right) / Math.max(left.length, right.length);
  return round(Math.max(tokenScore, distanceScore));
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function round(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 10000) / 10000));
}


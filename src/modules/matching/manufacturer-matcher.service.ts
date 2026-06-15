import { textSimilarity } from "./brand-matcher.service";

export class ManufacturerMatcherService {
  matchManufacturer(source?: string, canonical?: string): number {
    return textSimilarity(source, canonical);
  }
}


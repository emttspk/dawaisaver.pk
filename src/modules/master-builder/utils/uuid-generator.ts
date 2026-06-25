import { createHash } from 'crypto';

export function deterministicUuid(seed: string): string {
  return createHash('sha256').update(seed).digest('hex').substring(0, 32);
}
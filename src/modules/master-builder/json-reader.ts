import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { opendir } from 'node:fs/promises';
import { join } from 'node:path';
import type { NormalizedJsonRecord } from './master-builder.types';

export class JsonReader {
  private readonly dataPath: string;

  constructor(dataPath: string = 'data/json') {
    this.dataPath = dataPath;
  }

  async readAll(): Promise<NormalizedJsonRecord[]> {
    const records: NormalizedJsonRecord[] = [];

    for await (const record of this.iterateAll()) {
      records.push(record);
    }

    return records;
  }

  async *iterateAll(): AsyncGenerator<NormalizedJsonRecord> {
    if (!existsSync(this.dataPath)) {
      return;
    }

    const dir = await opendir(this.dataPath);
    for await (const entry of dir) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) {
        continue;
      }

      const filePath = join(this.dataPath, entry.name);
      const content = readFileSync(filePath, 'utf-8');
      const record: NormalizedJsonRecord = JSON.parse(content);
      yield record;
    }
  }

  async readByRegistration(registrationNumber: string): Promise<NormalizedJsonRecord | null> {
    const filePath = join(this.dataPath, `${registrationNumber}.json`);
    
    if (!existsSync(filePath)) {
      return null;
    }

    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  getStats(): { total: number; files: string[] } {
    if (!existsSync(this.dataPath)) {
      return { total: 0, files: [] };
    }

    const files = readdirSync(this.dataPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    return {
      total: jsonFiles.length,
      files: jsonFiles,
    };
  }
}

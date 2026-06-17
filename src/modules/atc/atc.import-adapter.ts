import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { XMLParser } from "fast-xml-parser";
import * as XLSX from "xlsx";
import { AtcFileFormat, AtcSourceRow } from "./atc.types";

export class AtcImportAdapter {
  async readFileRows(filePath: string): Promise<AtcSourceRow[]> {
    const format = this.detectFormat(filePath);
    const payload = await readFile(filePath);
    return this.parsePayload(format, payload);
  }

  parsePayload(format: AtcFileFormat, payload: string | Buffer): AtcSourceRow[] {
    if (format === "csv" || format === "txt") {
      return this.parseDelimitedText(this.toText(payload));
    }

    if (format === "xlsx") {
      return this.parseXlsx(payload);
    }

    if (format === "xml") {
      return this.parseXml(this.toText(payload));
    }

    throw new Error(`Unsupported ATC file format: ${format}`);
  }

  detectFormat(filePath: string): AtcFileFormat {
    const extension = extname(filePath).toLowerCase();

    if (extension === ".csv") {
      return "csv";
    }

    if (extension === ".xlsx") {
      return "xlsx";
    }

    if (extension === ".xml") {
      return "xml";
    }

    return "txt";
  }

  private parseDelimitedText(input: string): AtcSourceRow[] {
    const lines = input
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return [];
    }

    const delimiter = this.detectDelimiter(lines[0]);
    const headers = this.splitLine(lines[0], delimiter).map((value) => value.trim());

    return lines.slice(1).map((line, index) => {
      const values = this.splitLine(line, delimiter);
      const raw = headers.reduce<Record<string, string>>((record, header, headerIndex) => {
        record[header] = values[headerIndex] || "";
        return record;
      }, {});

      return this.normalizeRawRow(raw, index + 2);
    });
  }

  private parseXlsx(payload: string | Buffer): AtcSourceRow[] {
    const buffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, "utf8");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheet = workbook.SheetNames[0];

    if (!firstSheet) {
      return [];
    }

    const sheet = workbook.Sheets[firstSheet];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });

    return rows.map((row, index) => {
      const raw = Object.entries(row).reduce<Record<string, string>>((record, [key, value]) => {
        record[key] = this.stringify(value);
        return record;
      }, {});

      return this.normalizeRawRow(raw, index + 2);
    });
  }

  private parseXml(input: string): AtcSourceRow[] {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      trimValues: true,
    });
    const parsed = parser.parse(input);
    const rows = this.extractXmlRows(parsed);

    return rows.map((row, index) => {
      const raw = Object.entries(row).reduce<Record<string, string>>((record, [key, value]) => {
        record[key] = this.stringify(value);
        return record;
      }, {});

      return this.normalizeRawRow(raw, index + 1);
    });
  }

  private extractXmlRows(value: unknown): Array<Record<string, unknown>> {
    if (Array.isArray(value)) {
      return value.flatMap((item) => this.extractXmlRows(item));
    }

    if (!value || typeof value !== "object") {
      return [];
    }

    const record = value as Record<string, unknown>;
    if (this.looksLikeAtcRow(record)) {
      return [record];
    }

    return Object.values(record).flatMap((item) => this.extractXmlRows(item));
  }

  private looksLikeAtcRow(record: Record<string, unknown>): boolean {
    return Object.keys(record).some((key) => this.normalizeHeader(key) === "atc_code");
  }

  private normalizeRawRow(raw: Record<string, string>, rowNumber: number): AtcSourceRow {
    const normalized = this.normalizeKeys(raw);

    return {
      rowNumber,
      atcCode: this.pick(normalized, "atc_code", "code", "atccode") || "",
      atcName: this.pick(normalized, "atc_name", "name", "atcname") || "",
      ddd: this.pick(normalized, "ddd"),
      uom: this.pick(normalized, "uom"),
      admR: this.pick(normalized, "adm_r", "admr"),
      note: this.pick(normalized, "note"),
      raw,
    };
  }

  private normalizeKeys(raw: Record<string, string>): Record<string, string> {
    return Object.entries(raw).reduce<Record<string, string>>((record, [key, value]) => {
      record[this.normalizeHeader(key)] = value;
      return record;
    }, {});
  }

  private pick(record: Record<string, string>, ...keys: string[]): string | undefined {
    for (const key of keys) {
      const value = record[key];
      if (value && value.trim().length > 0) {
        return value.trim();
      }
    }

    return undefined;
  }

  private detectDelimiter(headerLine: string): string {
    const candidates = [",", "\t", ";", "|"];
    const ranked = candidates
      .map((delimiter) => ({
        delimiter,
        count: (headerLine.match(new RegExp(this.escapeRegExp(delimiter), "g")) || []).length,
      }))
      .sort((left, right) => right.count - left.count);

    return ranked[0]?.delimiter || ",";
  }

  private splitLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let current = "";
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];

      if (char === '"' && next === '"') {
        current += '"';
        index += 1;
        continue;
      }

      if (char === '"') {
        quoted = !quoted;
        continue;
      }

      if (char === delimiter && !quoted) {
        values.push(current);
        current = "";
        continue;
      }

      current += char;
    }

    values.push(current);
    return values.map((value) => value.trim());
  }

  private stringify(value: unknown): string {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    return JSON.stringify(value);
  }

  private normalizeHeader(value: string): string {
    return value
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  private toText(payload: string | Buffer): string {
    return Buffer.isBuffer(payload) ? payload.toString("utf8") : payload;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

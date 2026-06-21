import { Injectable } from "@nestjs/common";
import { createHash, createHmac } from "crypto";

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  stream: any;
  destination: string;
  filename: string;
  path: string;
}

export interface UploadObjectOptions {
  originalName: string;
  mimeType: string;
  folder?: string;
  objectKey?: string;
}

@Injectable()
export class UploadService {
  async upload(file: MulterFile): Promise<UploadedFile> {
    return this.uploadBuffer(file.buffer, {
      originalName: file.originalname,
      mimeType: file.mimetype,
      folder: "ocr",
    });
  }

  async uploadBuffer(buffer: Buffer, options: UploadObjectOptions): Promise<UploadedFile> {
    const key = options.objectKey || this.createObjectKey(options.originalName, options.folder);

    await this.signedRequest("PUT", key, buffer, options.mimeType);

    return {
      filename: key,
      originalName: options.originalName,
      mimeType: options.mimeType,
      size: buffer.length,
      path: key,
      url: this.buildObjectUrl(key),
    };
  }

  async uploadText(content: string, options: UploadObjectOptions): Promise<UploadedFile> {
    return this.uploadBuffer(Buffer.from(content, "utf8"), options);
  }

  async delete(filename: string): Promise<void> {
    const key = this.normalizeObjectKey(filename);
    await this.signedRequest("DELETE", key);
  }

  private async signedRequest(method: "PUT" | "DELETE", key: string, body?: Buffer, contentType?: string): Promise<void> {
    const accountId = this.requireEnv("R2_ACCOUNT_ID");
    const accessKeyId = this.requireEnv("R2_ACCESS_KEY_ID");
    const secretAccessKey = this.requireEnv("R2_SECRET_ACCESS_KEY");
    const bucketName = this.requireEnv("R2_BUCKET_NAME");

    const requestUrl = this.buildS3Url(accountId, bucketName, key);
    const payload = body || Buffer.alloc(0);
    const amzDate = this.toAmzDate(new Date());
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = this.sha256Hex(payload);

    const headers: Record<string, string> = {
      host: requestUrl.host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    };

    if (contentType) {
      headers["content-type"] = contentType;
    }

    const canonicalHeaders = this.buildCanonicalHeaders(headers);
    const signedHeaders = Object.keys(canonicalHeaders)
      .sort()
      .join(";");
    const canonicalRequest = [
      method,
      this.canonicalUri(bucketName, key),
      "",
      Object.entries(canonicalHeaders)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, value]) => `${name}:${value}\n`)
        .join(""),
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      this.sha256Hex(Buffer.from(canonicalRequest, "utf8")),
    ].join("\n");

    const signingKey = this.getSigningKey(secretAccessKey, dateStamp, "auto", "s3");
    const signature = createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");
    const authorization = [
      `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(", ");

    const response = await fetch(requestUrl, {
      method,
      headers: {
        ...headers,
        authorization,
      },
      body: method === "PUT" ? new Uint8Array(payload) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`R2 ${method} failed for ${key}: ${response.status} ${response.statusText} ${errorText}`.trim());
    }
  }

  private buildObjectUrl(key: string): string | undefined {
    const publicBaseUrl = String(process.env.R2_PUBLIC_BASE_URL || "").trim();
    if (!publicBaseUrl) {
      return undefined;
    }
    return `${publicBaseUrl}/${this.encodeKey(key)}`;
  }

  private buildS3Url(accountId: string, bucketName: string, key: string): URL {
    return new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${this.encodeKey(key)}`);
  }

  private canonicalUri(bucketName: string, key: string): string {
    return `/${this.encodeKey(bucketName)}/${this.encodeKey(key)}`;
  }

  private encodeKey(value: string): string {
    return value
      .split("/")
      .filter((segment) => segment.length > 0)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
  }

  private createObjectKey(originalName: string, folder = "ocr"): string {
    const timestamp = Date.now();
    const sanitized = this.sanitizeFilename(originalName);
    const prefix = folder.replace(/^\/+|\/+$/g, "");
    return `${prefix}/${timestamp}-${sanitized}`;
  }

  private normalizeObjectKey(filename: string): string {
    const cleaned = filename.replace(/^\/+/, "").trim();
    if (!cleaned) {
      throw new Error("A valid R2 object key is required.");
    }
    return cleaned;
  }

  private sanitizeFilename(filename: string): string {
    const baseName = filename.split(/[\\/]/).pop() || "upload.bin";
    const safeName = baseName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
    return safeName || "upload.bin";
  }

  private buildCanonicalHeaders(headers: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(headers).map(([name, value]) => [
        name.toLowerCase(),
        value.trim().replace(/\s+/g, " "),
      ]),
    );
  }

  private getSigningKey(secretAccessKey: string, dateStamp: string, region: string, service: string): Buffer {
    const kDate = createHmac("sha256", `AWS4${secretAccessKey}`).update(dateStamp, "utf8").digest();
    const kRegion = createHmac("sha256", kDate).update(region, "utf8").digest();
    const kService = createHmac("sha256", kRegion).update(service, "utf8").digest();
    return createHmac("sha256", kService).update("aws4_request", "utf8").digest();
  }

  private sha256Hex(value: Buffer): string {
    return createHash("sha256").update(value).digest("hex");
  }

  private toAmzDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
    const day = `${date.getUTCDate()}`.padStart(2, "0");
    const hours = `${date.getUTCHours()}`.padStart(2, "0");
    const minutes = `${date.getUTCMinutes()}`.padStart(2, "0");
    const seconds = `${date.getUTCSeconds()}`.padStart(2, "0");
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  private requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`${name} is required for R2 uploads.`);
    }
    return value;
  }
}

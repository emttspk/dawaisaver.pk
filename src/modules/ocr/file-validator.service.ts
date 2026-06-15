import { Injectable } from "@nestjs/common";

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
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

@Injectable()
export class FileValidatorService {
  private readonly defaultOptions: ValidationOptions = {
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".pdf"],
  };

  validate(file: MulterFile, options?: ValidationOptions): FileValidationResult {
    const opts = { ...this.defaultOptions, ...options };
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!file) {
      errors.push("No file provided");
      return { valid: false, errors, warnings };
    }

    if (opts.maxSizeBytes && file.size > opts.maxSizeBytes) {
      errors.push(`File size exceeds maximum of ${opts.maxSizeBytes} bytes`);
    }

    if (opts.allowedMimeTypes && !opts.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    const ext = this.getFileExtension(file.originalname).toLowerCase();
    if (opts.allowedExtensions && !opts.allowedExtensions.includes(ext)) {
      errors.push(`File extension ${ext} is not allowed`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf(".") - 1) || 0) + 1);
  }
}
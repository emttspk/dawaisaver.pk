export class ResponseFormatter {
  static success<T>(data: T, meta?: Record<string, unknown>) {
    return {
      success: true,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
  }

  static error(input: {
    code: number | string;
    error: string;
  }) {
    return {
      success: false,
      error: input.error,
      code: input.code,
      timestamp: new Date().toISOString(),
    };
  }
}

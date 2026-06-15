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
    statusCode: number;
    message: string;
    path?: string;
    traceId?: string;
  }) {
    return {
      success: false,
      error: {
        statusCode: input.statusCode,
        message: input.message,
        path: input.path,
        traceId: input.traceId,
      },
      timestamp: new Date().toISOString(),
    };
  }
}


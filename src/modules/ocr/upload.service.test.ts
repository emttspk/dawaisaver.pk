import { UploadService } from "./upload.service";

describe("UploadService", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-access-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET_NAME = "dawaisaver-pk";
    process.env.R2_PUBLIC_BASE_URL = "https://cdn.example.com";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: jest.fn().mockResolvedValue(""),
    }) as typeof fetch;
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
    global.fetch = originalFetch;
  });

  it("uploads files to R2 and returns a public URL", async () => {
    const service = new UploadService();
    const fileBuffer = Buffer.from("demo");

    const result = await service.upload({
      fieldname: "file",
      originalname: "scan one.png",
      encoding: "7bit",
      mimetype: "image/png",
      size: fileBuffer.length,
      buffer: fileBuffer,
      stream: null,
      destination: "",
      filename: "",
      path: "",
    });

    expect(result.filename).toMatch(/^ocr\/\d+-scan-one\.png$/);
    expect(result.path).toBe(result.filename);
    expect(result.url).toMatch(/^https:\/\/cdn\.example\.com\/ocr\/\d+-scan-one\.png$/);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [requestUrl, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(requestUrl)).toContain("https://test-account.r2.cloudflarestorage.com/dawaisaver-pk/ocr/");
    expect(requestInit.method).toBe("PUT");
    expect(requestInit.headers.authorization).toContain("AWS4-HMAC-SHA256");
  });

  it("deletes objects from R2", async () => {
    const service = new UploadService();

    await service.delete("ocr/123-scan-one.png");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(requestUrl)).toContain("https://test-account.r2.cloudflarestorage.com/dawaisaver-pk/ocr/123-scan-one.png");
    expect(requestInit.method).toBe("DELETE");
  });
});

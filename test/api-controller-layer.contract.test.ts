import { of, throwError } from "rxjs";
import { ResponseEnvelopeInterceptor } from "../src/common/interceptors/response-envelope.interceptor";
import { GlobalExceptionFilter } from "../src/common/filters/global-exception.filter";
import { ResponseFormatter } from "../src/common/responses/response-formatter";

describe("API response contracts", () => {
  it("wraps success payloads in the standard envelope", async () => {
    const interceptor = new ResponseEnvelopeInterceptor();
    const result = await new Promise((resolve) => {
      interceptor
        .intercept({} as never, {
          handle: () => of({ items: [1, 2, 3] }),
        } as never)
        .subscribe(resolve);
    });

    expect(result).toMatchObject({
      success: true,
      data: { items: [1, 2, 3] },
    });
  });

  it("formats application errors in the standard error envelope", () => {
    const filter = new GlobalExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url: "/api/search" }),
      }),
    } as never;

    filter.catch(new Error("Boom"), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "Boom",
        code: 500,
      }),
    );
  });

  it("keeps the formatter helpers aligned with the API contract", () => {
    expect(ResponseFormatter.success({ ok: true })).toMatchObject({
      success: true,
      data: { ok: true },
    });
    expect(ResponseFormatter.error({ code: 400, error: "Bad request" })).toMatchObject({
      success: false,
      error: "Bad request",
      code: 400,
    });
  });
});

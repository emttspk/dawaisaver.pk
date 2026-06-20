const DEFAULT_BACKEND_ORIGIN = "http://yh5wt7bbkhqsjycey5df0lbe.178.105.221.236.sslip.io";

export const onRequestGet = (context: any) => proxyRequest(context);
export const onRequestPost = (context: any) => proxyRequest(context);
export const onRequestPut = (context: any) => proxyRequest(context);
export const onRequestPatch = (context: any) => proxyRequest(context);
export const onRequestDelete = (context: any) => proxyRequest(context);
export const onRequestOptions = (context: any) => handleOptions(context.request);

async function proxyRequest(context: any) {
  const backendOrigin = (context.env?.BACKEND_ORIGIN || DEFAULT_BACKEND_ORIGIN).replace(/\/$/, "");
  const incomingUrl = new URL(context.request.url);
  const targetUrl = new URL(backendOrigin);

  targetUrl.pathname = incomingUrl.pathname;
  targetUrl.search = incomingUrl.search;

  const headers = new Headers(context.request.headers);
  headers.delete("host");
  headers.delete("origin");
  headers.delete("referer");
  headers.set("x-forwarded-host", incomingUrl.host);
  headers.set("x-forwarded-proto", incomingUrl.protocol.replace(":", ""));

  const init: RequestInit = {
    method: context.request.method,
    headers,
    redirect: "manual",
  };

  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    init.body = await context.request.arrayBuffer();
  }

  const response = await fetch(targetUrl.toString(), init);
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("access-control-allow-origin", incomingUrl.origin);
  responseHeaders.set("access-control-allow-credentials", "true");
  responseHeaders.set("vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

function handleOptions(request: Request) {
  const origin = new URL(request.url).origin;
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": origin,
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
      "access-control-max-age": "86400",
      vary: "Origin",
    },
  });
}

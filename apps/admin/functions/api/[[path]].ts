const DEFAULT_BACKEND_ORIGIN = "http://yh5wt7bbkhqsjycey5df0lbe.178.105.221.236.sslip.io";

interface Env {
  API_BASE_URL: string;
}

export const onRequest: PagesFunction<Env>[] = [
  async (context) => {
    const url = new URL(context.request.url);
    const apiBase = context.env.API_BASE_URL || DEFAULT_BACKEND_ORIGIN;
    const targetUrl = `${apiBase}${url.pathname}${url.search}`;

    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': url.origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
          vary: 'Origin',
        },
      });
    }

    const headers = new Headers(context.request.headers);
    headers.delete('host');
    headers.delete('origin');
    headers.delete('referer');
    headers.set('x-forwarded-host', url.host);
    headers.set('x-forwarded-proto', url.protocol.replace(':', ''));

    const body = context.request.method !== 'GET' && context.request.method !== 'HEAD'
      ? await context.request.arrayBuffer()
      : undefined;

    const response = await fetch(targetUrl, {
      method: context.request.method,
      headers,
      body,
      redirect: 'manual',
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('access-control-allow-origin', url.origin);
    responseHeaders.set('access-control-allow-credentials', 'true');
    responseHeaders.set('vary', 'Origin');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  }
];
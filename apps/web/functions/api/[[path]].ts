interface Env {
  API_BASE_URL: string;
}

export const onRequest: PagesFunction<Env>[] = [
  async (context) => {
    const url = new URL(context.request.url);
    const apiBase = context.env.API_BASE_URL || 'http://localhost:3000';
    const targetUrl = `${apiBase}${url.pathname}${url.search}`;

    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const headers = new Headers(context.request.headers);
    headers.set('Host', new URL(apiBase).host);

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
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  }
];
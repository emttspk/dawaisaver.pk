interface Env {
  API_BASE_URL: string;
}

export const onRequest: PagesFunction<Env>[] = [
  async (context) => {
    const url = new URL(context.request.url);
    const apiBase = context.env.API_BASE_URL || 'http://localhost:3000';
    const targetUrl = `${apiBase}${url.pathname}${url.search}`;

    const headers = new Headers(context.request.headers);
    headers.set('Host', new URL(apiBase).host);

    const response = await fetch(targetUrl, {
      method: context.request.method,
      headers,
      body: context.request.method !== 'GET' && context.request.method !== 'HEAD'
        ? await context.request.blob()
        : undefined,
    });

    return response;
  }
];
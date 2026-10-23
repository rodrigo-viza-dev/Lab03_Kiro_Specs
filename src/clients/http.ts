export interface JsonHttpResponse {
  status: number;
  body?: unknown;
}

export class HttpClientError extends Error {
  constructor(
    readonly type: 'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE',
    options?: ErrorOptions,
  ) {
    super(type, options);
    this.name = 'HttpClientError';
  }
}

export async function requestJson(
  url: URL,
  fetcher: typeof fetch,
  timeoutMs: number,
): Promise<JsonHttpResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response: Response;
    try {
      response = await fetcher(url, { signal: controller.signal });
    } catch (error) {
      if (isAbortError(error)) {
        throw new HttpClientError('TIMEOUT', { cause: error });
      }
      throw new HttpClientError('NETWORK_ERROR', { cause: error });
    }

    if (!response.ok) {
      return { status: response.status };
    }

    try {
      return { status: response.status, body: await response.json() };
    } catch (error) {
      if (isAbortError(error)) {
        throw new HttpClientError('TIMEOUT', { cause: error });
      }
      throw new HttpClientError('INVALID_RESPONSE', { cause: error });
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}

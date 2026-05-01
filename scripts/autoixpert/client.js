// AutoiXpert HTTP client.
// Bearer auth, throttling, retry-with-backoff for 429/5xx, structured errors.
//
// Ref: docs/autoixpert-api/raw/02-authentifizierung.md
//      docs/autoixpert-api/raw/05-rechnungen.md (error_details)

export class AutoiXpertError extends Error {
  constructor({ status_code, endpoint, error_code, error_message, error_details }) {
    super(error_message || `AutoiXpert error: ${error_code || status_code}`);
    this.name = 'AutoiXpertError';
    this.statusCode = status_code;
    this.endpoint = endpoint;
    this.errorCode = error_code;
    this.errorDetails = error_details;
  }

  isAuthError() {
    return typeof this.errorCode === 'string' && this.errorCode.startsWith('API_AUTHENTICATION_');
  }

  isRetryable() {
    // Auth/validation errors: don't retry. Rate limit/server errors: do.
    if (this.isAuthError()) return false;
    if (this.statusCode === 429) return true;
    if (this.statusCode >= 500 && this.statusCode < 600) return true;
    return false;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createAutoixpertClient({
  baseUrl = 'https://app.autoixpert.de/externalApi/v1',
  apiKey,
  requestDelayMs = 200,
  maxRetries = 4,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!apiKey) {
    throw new Error('AutoiXpert client: apiKey is required');
  }
  if (!fetchImpl) {
    throw new Error('AutoiXpert client: fetch is not available (Node 18+ required)');
  }

  const trimmedBase = baseUrl.replace(/\/+$/, '');

  async function request(method, path, { query, body } = {}) {
    const url = new URL(trimmedBase + (path.startsWith('/') ? path : `/${path}`));
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        url.searchParams.set(k, String(v));
      }
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetchImpl(url, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        // Throttle between requests (rate-limit politeness)
        if (requestDelayMs > 0) await sleep(requestDelayMs);

        if (res.ok) {
          // 200/201 etc.
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            return await res.json();
          }
          // Binary (e.g. PDF/XML download) — return raw response
          return res;
        }

        // Non-OK: parse AutoiXpert error envelope
        let payload;
        try {
          payload = await res.json();
        } catch {
          payload = {
            status_code: res.status,
            endpoint: url.pathname,
            error_code: 'UNKNOWN',
            error_message: `HTTP ${res.status} ${res.statusText}`,
          };
        }
        const err = new AutoiXpertError({
          status_code: payload.status_code ?? res.status,
          endpoint: payload.endpoint ?? url.pathname,
          error_code: payload.error_code ?? 'UNKNOWN',
          error_message: payload.error_message ?? `HTTP ${res.status}`,
          error_details: payload.error_details,
        });

        if (!err.isRetryable() || attempt === maxRetries) throw err;

        const backoffMs = Math.min(1000 * 2 ** attempt, 30_000);
        // Honor Retry-After if present (seconds or HTTP date)
        const retryAfterHeader = res.headers.get('retry-after');
        const retryAfterMs = parseRetryAfter(retryAfterHeader);
        const waitMs = retryAfterMs ?? backoffMs;
        console.warn(
          `[autoixpert] retry ${attempt + 1}/${maxRetries} after ${waitMs}ms (${err.statusCode} ${err.errorCode})`,
        );
        await sleep(waitMs);
        lastError = err;
      } catch (e) {
        // Network errors (TypeError from fetch) — retry like 5xx
        if (e instanceof AutoiXpertError) {
          if (!e.isRetryable() || attempt === maxRetries) throw e;
          lastError = e;
        } else {
          if (attempt === maxRetries) throw e;
          const backoffMs = Math.min(1000 * 2 ** attempt, 30_000);
          console.warn(`[autoixpert] network retry ${attempt + 1}/${maxRetries} after ${backoffMs}ms (${e.message})`);
          await sleep(backoffMs);
          lastError = e;
        }
      }
    }
    throw lastError;
  }

  return {
    get: (path, query) => request('GET', path, { query }),
    post: (path, body, query) => request('POST', path, { body, query }),
    patch: (path, body) => request('PATCH', path, { body }),
    delete: (path) => request('DELETE', path),
  };
}

function parseRetryAfter(headerValue) {
  if (!headerValue) return null;
  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const dateMs = Date.parse(headerValue);
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
  return null;
}

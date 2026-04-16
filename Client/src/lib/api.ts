/**
 * Typed HTTP client for the Aura API.
 * Uses relative `/api/*` in development (Vite proxy) or `VITE_API_URL` + `/api/*` when set.
 */

const API_ORIGIN = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function resolveApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const withApi = normalized.startsWith('/api') ? normalized : `/api${normalized}`;
  return API_ORIGIN ? `${API_ORIGIN}${withApi}` : withApi;
}

export type ApiFetchOptions = RequestInit & { skipAuth?: boolean };

/** Non-API routes (e.g. liveness) mounted at server root, not under `/api`. */
export function resolvePublicUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return API_ORIGIN ? `${API_ORIGIN}${normalized}` : normalized;
}

export async function publicFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(resolvePublicUrl(path), init);
  const raw = await response.text();

  if (!response.ok) {
    throw new ApiError(response.status, raw || `HTTP ${response.status}`);
  }

  if (raw === '') {
    return undefined as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError(response.status, 'Invalid JSON from server');
  }
}

// eslint-disable-next-line complexity
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { skipAuth, ...init } = options;
  const url = resolveApiUrl(path);

  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const token = localStorage.getItem('aura_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, { ...init, headers });
  const raw = await response.text();

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    if (raw) {
      try {
        const body = JSON.parse(raw) as { message?: string; error?: string };
        message = body.error ?? body.message ?? message;
      } catch {
        message = raw;
      }
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204 || raw === '') {
    return undefined as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError(response.status, 'Invalid JSON response from server');
  }
}

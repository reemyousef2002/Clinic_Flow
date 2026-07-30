/**
 * Low-level HTTP client for the ClinicFlow Django backend.
 *
 * Handles: base URL, JSON encoding, attaching the JWT, retrying once on a
 * 401 by refreshing the access token, and turning DRF error payloads into
 * plain Error objects with readable messages (so existing try/catch and
 * toast.error(err.message) calls in the app keep working unmodified).
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

// Must match the TOKEN_KEY constant in src/hooks/use-auth.tsx
const TOKEN_KEY = "clinicflow_token";
// Internal-only key we use to remember the refresh token across page loads.
const REFRESH_KEY = "clinicflow_refresh";

function getStore(): Storage | null {
  if (typeof window === "undefined") return null;
  // useAuth stores the access token in either localStorage or sessionStorage
  // depending on "remember me" — check both.
  if (window.localStorage.getItem(TOKEN_KEY)) return window.localStorage;
  if (window.sessionStorage.getItem(TOKEN_KEY)) return window.sessionStorage;
  return null;
}

export function getAccessToken(): string | null {
  return getStore()?.getItem(TOKEN_KEY) ?? null;
}

function setAccessToken(token: string) {
  const store = getStore() ?? (typeof window !== "undefined" ? window.localStorage : null);
  store?.setItem(TOKEN_KEY, token);
}

export function setRefreshToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFRESH_KEY, token);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

/** Extracts a readable message from a DRF error response body. */
function extractErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const b = body as Record<string, unknown>;
  if (typeof b.detail === "string") return b.detail;
  if (Array.isArray(b.non_field_errors) && b.non_field_errors.length) {
    return String(b.non_field_errors[0]);
  }
  // First field-level error, e.g. { email: ["This field is required."] }
  for (const key of Object.keys(b)) {
    const val = b[key];
    if (Array.isArray(val) && val.length) return `${key}: ${val[0]}`;
  }
  return fallback;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.access) {
      setAccessToken(data.access);
      return data.access as string;
    }
    return null;
  } catch {
    return null;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Explicit bearer token to use instead of the one in storage (used by auth flows). */
  tokenOverride?: string;
  /** Internal flag to prevent infinite refresh loops. */
  _retried?: boolean;
}

export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, tokenOverride, _retried } = options;
  const token = tokenOverride ?? getAccessToken();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Access token expired mid-session — try one silent refresh, then retry the call.
  if (res.status === 401 && !tokenOverride && !_retried) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, { ...options, _retried: true });
    }
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new Error(extractErrorMessage(data, `Request failed (${res.status})`));
  }

  return data as T;
}

/** Fetches every page of a DRF-paginated list endpoint and returns the combined results. */
export async function apiFetchAllPages<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  let nextPath: string | null = path;

  while (nextPath) {
    const page: { results: T[]; next: string | null } = await apiFetch(nextPath);
    results.push(...page.results);
    // DRF returns `next` as a full absolute URL — strip the origin so apiFetch
    // (which prepends BASE_URL itself) doesn't double it up.
    nextPath = page.next ? page.next.replace(/^https?:\/\/[^/]+\/api/, "") : null;
  }

  return results;
}

export { BASE_URL };

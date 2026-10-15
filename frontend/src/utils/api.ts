import type { ProblemDetails } from '../types/api';
import { redirectTo } from './navigation';
import { loginPath } from './returnTo';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  readonly status: number;
  /** Seconds the server asked us to wait (Retry-After), or null when it didn't say or we can't read it */
  readonly retryAfter: number | null;

  constructor(message: string, status: number, retryAfter: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export const isRateLimited = (error: unknown): error is ApiError => error instanceof ApiError && error.status === 429;

// Longer waits than this are treated as nonsense rather than shown as a day-long countdown
const MAX_RETRY_AFTER_SECONDS = 60 * 60;

/**
 * Reads a Retry-After header: delay-seconds ("42") or an HTTP date. Missing, malformed or absurd
 * values give null. Note: cross-origin, browsers only expose this header if the API lists it in
 * Access-Control-Expose-Headers, so callers must cope with null.
 */
export const parseRetryAfter = (header: string | null, now = Date.now()): number | null => {
  const value = header?.trim();
  if (!value) return null;

  let seconds: number;
  if (/^\d+$/.test(value)) {
    seconds = Number(value);
  } else if (/^[A-Za-z]{3}/.test(value)) {
    // Every HTTP-date format starts with the day name ("Fri, 16 Oct 2026 10:00:30 GMT")
    const date = Date.parse(value);
    if (Number.isNaN(date)) return null;
    seconds = Math.max(0, Math.ceil((date - now) / 1000));
  } else {
    return null;
  }
  return Number.isSafeInteger(seconds) && seconds <= MAX_RETRY_AFTER_SECONDS ? seconds : null;
};

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

// Validation errors list the actual field problems; other errors use the backend's
// legacy "message" field, then the standard ProblemDetails fields.
const errorMessage = (problem: ProblemDetails | null | undefined, status: number): string => {
  const fieldErrors = Object.values(problem?.errors ?? {}).flat();
  if (fieldErrors.length > 0) {
    return fieldErrors.join(' ');
  }
  return problem?.message || problem?.detail || problem?.title || `API error: ${status}`;
};

// Login and registration answer 401/400 for bad credentials; that is not an expired session
const isAuthEndpoint = (endpoint: string) => endpoint.startsWith('/auth/');

export const apiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  // Expired or invalid session: clear it and send the user back to login, then on to where they were
  if (response.status === 401 && token && !isAuthEndpoint(endpoint)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    const { pathname, search, hash } = window.location;
    redirectTo(loginPath(pathname + search + hash));
  }

  const text = await response.text();
  // Error pages from proxies or servers may not be JSON; treat them as having no details
  const data = text ? parseJson(text) : null;

  if (!response.ok) {
    throw new ApiError(
      errorMessage(data as ProblemDetails | null | undefined, response.status),
      response.status,
      parseRetryAfter(response.headers.get('Retry-After'))
    );
  }

  if (data === undefined) {
    throw new ApiError('The server sent an unexpected response. Please try again.', response.status);
  }

  return data as T;
};

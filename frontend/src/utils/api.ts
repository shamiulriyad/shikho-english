import type { ProblemDetails } from '../types/api';
import { redirectTo } from './navigation';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

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

  // Expired or invalid session: clear it and send the user back to login
  if (response.status === 401 && token && !isAuthEndpoint(endpoint)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    redirectTo('/login');
  }

  const text = await response.text();
  // Error pages from proxies or servers may not be JSON; treat them as having no details
  const data = text ? parseJson(text) : null;

  if (!response.ok) {
    throw new ApiError(errorMessage(data as ProblemDetails | null | undefined, response.status), response.status);
  }

  if (data === undefined) {
    throw new ApiError('The server sent an unexpected response. Please try again.', response.status);
  }

  return data as T;
};

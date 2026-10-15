// Where to send a student after login, and how to remember where they were going.

export const DEFAULT_AFTER_LOGIN = '/analyze';

// Returning to these would loop straight back to a sign-in form
const AUTH_PATHS = ['/login', '/register'];
const PROBE_ORIGIN = 'http://internal.invalid';

/**
 * Accepts only a path inside this app ("/history?page=2"). Anything that could leave the site
 * (absolute or protocol-relative URLs, backslash tricks, control characters) returns null.
 */
export const safeReturnTo = (raw: string | null | undefined): string | null => {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return null;
  if (/[\u0000-\u001F\u007F]/.test(raw)) return null;

  let url: URL;
  try {
    url = new URL(raw, PROBE_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PROBE_ORIGIN || AUTH_PATHS.includes(url.pathname)) return null;

  return url.pathname + url.search + url.hash;
};

/** The login page, remembering `returnTo` when it is a safe in-app destination worth returning to. */
export const loginPath = (returnTo?: string | null): string => {
  const safe = safeReturnTo(returnTo);
  return safe && safe !== '/' ? `/login?next=${encodeURIComponent(safe)}` : '/login';
};

/** Keeps the pending destination when switching between the login and register pages. */
export const withReturnTo = (path: string, returnTo: string | null): string =>
  returnTo ? `${path}?next=${encodeURIComponent(returnTo)}` : path;

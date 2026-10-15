import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { PracticeProvider } from '../context/PracticeContext';
import { LanguageProvider } from '../context/LanguageContext';
import { API_BASE_URL } from '../utils/api';
import type { User } from '../types/api';

export const testUser: User = {
  id: 1,
  email: 'student@example.com',
  username: 'student',
  fullName: 'Test Student',
  createdAt: '2026-10-15T00:00:00Z'
};

export const signIn = (user: User = testUser, token = 'test-token') => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' }
  });

export const problemResponse = (status: number, detail: string, title = 'Error') =>
  jsonResponse({ type: 'about:blank', title, status, detail, message: detail, traceId: 'trace-1' }, status);

/** Replaces fetch; each call gets the next response in order. */
export const mockFetch = (...responses: Response[]) => {
  const fetchMock = vi.fn<typeof fetch>();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

type RouteHandler = (init: RequestInit | undefined, url: URL) => Response;

/** Replaces fetch with a fake API keyed by "METHOD /path"; unexpected requests fail the test. */
export const mockApi = (routes: Record<string, RouteHandler>) => {
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(String(input));
    const path = url.pathname.replace(new URL(API_BASE_URL).pathname, '');
    const handler = routes[`${init?.method ?? 'GET'} ${path}`];
    if (!handler) {
      throw new Error(`Unexpected request ${init?.method ?? 'GET'} ${url}`);
    }
    return handler(init, url);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const LocationDisplay = () => <div data-testid="location">{useLocation().pathname}</div>;

/** Renders inside the app's providers and a router, with the current path shown for assertions. */
export const renderWithProviders = (ui: ReactElement, { route = '/' } = {}) =>
  render(
    <AuthProvider>
      <LanguageProvider>
        <PracticeProvider>
          <MemoryRouter initialEntries={[route]}>
            {ui}
            <Routes>
              <Route path="*" element={<LocationDisplay />} />
            </Routes>
          </MemoryRouter>
        </PracticeProvider>
      </LanguageProvider>
    </AuthProvider>
  );

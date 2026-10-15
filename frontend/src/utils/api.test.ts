import { describe, expect, test, vi } from 'vitest';
import { apiCall, ApiError, API_BASE_URL } from './api';
import { redirectTo } from './navigation';
import { jsonResponse, mockFetch, problemResponse, signIn } from '../test/utils';

vi.mock('./navigation', () => ({ redirectTo: vi.fn() }));

describe('apiCall', () => {
  test('sends JSON with the stored bearer token and returns the parsed body', async () => {
    signIn(undefined, 'abc123');
    const fetchMock = mockFetch(jsonResponse({ ok: true }));

    const data = await apiCall<{ ok: boolean }>('/practice/history');

    expect(data).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_BASE_URL}/practice/history`);
    const headers = new Headers(init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer abc123');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  test('defaults to the local backend when VITE_API_BASE_URL is not set', () => {
    expect(API_BASE_URL).toBe(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api');
  });

  test('sends no Authorization header when logged out', async () => {
    const fetchMock = mockFetch(jsonResponse([]));

    await apiCall('/topics');

    expect(new Headers(fetchMock.mock.calls[0]![1]?.headers).has('Authorization')).toBe(false);
  });

  test('returns null for an empty successful body', async () => {
    mockFetch(new Response(null, { status: 204 }));

    expect(await apiCall('/anything')).toBeNull();
  });

  test('uses the legacy "message" field of a ProblemDetails error', async () => {
    mockFetch(problemResponse(503, 'The AI service is currently unavailable. Please try again later.'));

    const error = await apiCall('/practice/submit').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe('The AI service is currently unavailable. Please try again later.');
    expect((error as ApiError).status).toBe(503);
  });

  test('falls back to detail, then title, then the status code', async () => {
    mockFetch(
      jsonResponse({ title: 'Not Found', status: 404, detail: 'Quiz not found' }, 404),
      jsonResponse({ title: 'Bad Request', status: 400 }, 400),
      jsonResponse({}, 500)
    );

    await expect(apiCall('/a')).rejects.toThrow('Quiz not found');
    await expect(apiCall('/b')).rejects.toThrow('Bad Request');
    await expect(apiCall('/c')).rejects.toThrow('API error: 500');
  });

  test('lists field errors from a validation ProblemDetails', async () => {
    mockFetch(jsonResponse({
      title: 'One or more validation errors occurred.',
      status: 400,
      message: 'One or more validation errors occurred.',
      errors: {
        Email: ['The Email field is not a valid e-mail address.'],
        Username: ['The field Username must be a string or array type with a minimum length of \'4\'.']
      }
    }, 400));

    await expect(apiCall('/auth/register')).rejects.toThrow(
      "The Email field is not a valid e-mail address. The field Username must be a string or array type with a minimum length of '4'."
    );
  });

  test('passes on the rate limit message', async () => {
    signIn();
    mockFetch(problemResponse(429, 'You are going too fast. Please wait a minute and try again.', 'Too many requests'));

    const error = await apiCall('/questions/analyze', { method: 'POST' }).catch((e: unknown) => e);

    expect((error as ApiError).status).toBe(429);
    expect((error as ApiError).message).toBe('You are going too fast. Please wait a minute and try again.');
    expect(redirectTo).not.toHaveBeenCalled();
  });

  test('handles a non-JSON error page without crashing', async () => {
    mockFetch(new Response('<html>Bad Gateway</html>', { status: 502, headers: { 'Content-Type': 'text/html' } }));

    await expect(apiCall('/practice/history')).rejects.toThrow('API error: 502');
  });

  test('rejects a successful response that is not JSON', async () => {
    mockFetch(new Response('<html>proxy login page</html>', { status: 200 }));

    await expect(apiCall('/practice/history')).rejects.toThrow('The server sent an unexpected response. Please try again.');
  });

  test('an expired session clears the stored login and redirects to /login', async () => {
    signIn();
    mockFetch(new Response(null, { status: 401 }));

    await expect(apiCall('/practice/history')).rejects.toBeInstanceOf(ApiError);

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(redirectTo).toHaveBeenCalledWith('/login');
  });

  test('a failed login with a stale token keeps the error instead of redirecting', async () => {
    signIn();
    mockFetch(problemResponse(401, 'Invalid email or password', 'Unauthorized'));

    await expect(apiCall('/auth/login', { method: 'POST' })).rejects.toThrow('Invalid email or password');

    expect(redirectTo).not.toHaveBeenCalled();
  });

  test('a 401 without a stored token does not redirect', async () => {
    mockFetch(new Response(null, { status: 401 }));

    await expect(apiCall('/practice/history')).rejects.toThrow('API error: 401');

    expect(redirectTo).not.toHaveBeenCalled();
  });
});

import { beforeEach, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PracticeProvider } from './context/PracticeContext';
import { LanguageProvider } from './context/LanguageContext';
import { jsonResponse, mockApi } from './test/utils';

// Pages that load reference data on mount must not reach a real server
beforeEach(() => {
  mockApi({ 'GET /topics': () => jsonResponse([]) });
});

const renderApp = (path = '/') => {
  window.history.pushState({}, '', path);
  render(
    <AuthProvider>
      <LanguageProvider>
        <PracticeProvider>
          <App />
        </PracticeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

test('renders the home page for a logged-out visitor', () => {
  renderApp();

  expect(screen.getByText(/master english grammar with ai/i)).toBeInTheDocument();
  expect(screen.getByText(/register now/i)).toBeInTheDocument();
  expect(screen.getByText(/why choose shikho english/i)).toBeInTheDocument();
});

test.each(['/practice', '/quiz', '/progress', '/analyze', '/history', '/questions/1', '/practice-sets/1'])('redirects a logged-out visitor from %s to login', async (path) => {
  renderApp(path);

  expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/login');
});

test('serves the register page', () => {
  renderApp('/register');

  expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
});

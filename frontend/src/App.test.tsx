import { beforeEach, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PracticeProvider } from './context/PracticeContext';
import { LanguageProvider } from './context/LanguageContext';
import { jsonResponse, mockApi, signIn, testUser } from './test/utils';

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

  expect(screen.getByRole('heading', { level: 1, name: 'English, finally making sense.' })).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'Start Learning' })[0]).toHaveAttribute('href', '/register');
});

test.each(['/practice', '/quiz', '/progress', '/analyze', '/history', '/questions/1', '/practice-sets/1'])('redirects a logged-out visitor from %s to login', async (path) => {
  renderApp(path);

  expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/login');
  expect(new URLSearchParams(window.location.search).get('next')).toBe(path);
});

test('never renders protected content for a logged-out visitor', () => {
  renderApp('/analyze');

  expect(screen.queryByRole('heading', { name: 'Analyze a Question' })).not.toBeInTheDocument();
});

test('after login the student lands on the page they asked for', async () => {
  mockApi({
    'GET /topics': () => jsonResponse([]),
    'POST /auth/login': () => jsonResponse({ success: true, message: 'Login successful', token: 'new-token', user: testUser }),
    'GET /questions/history': () => jsonResponse({ items: [], page: 1, pageSize: 10, totalCount: 0 })
  });
  renderApp('/history');

  await userEvent.type(await screen.findByLabelText('Email'), 'student@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'secret123');
  await userEvent.click(screen.getByRole('button', { name: 'Login' }));

  expect(await screen.findByRole('heading', { name: 'Question History' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/history');
});

test('logging out on a protected page goes home, not to login', async () => {
  signIn();
  mockApi({
    'GET /topics': () => jsonResponse([]),
    'GET /questions/history': () => jsonResponse({ items: [], page: 1, pageSize: 10, totalCount: 0 })
  });
  renderApp('/history');

  await userEvent.click(screen.getByRole('button', { name: /Account menu for/ }));
  await userEvent.click(within(document.getElementById('account-menu')!).getByRole('button', { name: 'Log out' }));

  expect(window.location.pathname).toBe('/');
  expect(screen.getByRole('heading', { level: 1, name: 'English, finally making sense.' })).toBeInTheDocument();
});

test('shows the not-found page for an unknown address', () => {
  renderApp('/no-such-page');

  expect(screen.getByRole('heading', { name: 'We couldn’t find that page' })).toBeInTheDocument();
  const main = within(screen.getByRole('main'));
  expect(main.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/');
  expect(main.queryByRole('link', { name: 'Analyze a question' })).not.toBeInTheDocument();
});

test('the not-found page offers analyze to a signed-in student', () => {
  signIn();
  renderApp('/practice-set/1');

  expect(within(screen.getByRole('main')).getByRole('link', { name: 'Analyze a question' })).toHaveAttribute('href', '/analyze');
});

test('serves the register page', () => {
  renderApp('/register');

  expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
});

test('a signed-in student who opens login goes to analyze instead', async () => {
  signIn();
  renderApp('/login');

  expect(await screen.findByRole('heading', { name: 'Analyze a Question' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/analyze');
});

test('a signed-in student who opens register follows a safe return address', async () => {
  signIn();
  mockApi({
    'GET /topics': () => jsonResponse([]),
    'GET /questions/history': () => jsonResponse({ items: [], page: 1, pageSize: 10, totalCount: 0 })
  });
  renderApp('/register?next=%2Fhistory');

  expect(await screen.findByRole('heading', { name: 'Question History' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/history');
});

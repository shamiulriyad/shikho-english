import { beforeEach, expect, test } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { PracticeProvider } from './context/PracticeContext';
import { jsonResponse, mockApi, signIn } from './test/utils';

beforeEach(() => {
  mockApi({
    'GET /topics': () => jsonResponse([{ code: 'articles', nameEn: 'Articles', nameBn: 'আর্টিকেল' }]),
    'GET /questions/history': (_init, url) =>
      jsonResponse({
        items: [{
          id: 1,
          topic: { code: 'articles', nameEn: 'Articles', nameBn: 'আর্টিকেল' },
          questionText: 'She is ___ honest girl.',
          correctAnswer: 'an',
          studentAnswerIsCorrect: null,
          createdAt: '2026-10-16T08:00:00Z'
        }],
        page: Number(url.searchParams.get('page') ?? 1),
        pageSize: 10,
        totalCount: 50
      })
  });
});

const renderApp = (path: string) => {
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

test('each page names the browser tab', async () => {
  renderApp('/login');
  await waitFor(() => expect(document.title).toBe('Login · Shikho English'));
});

test('moving to another page focuses the main content', async () => {
  signIn();
  renderApp('/analyze');
  await waitFor(() => expect(document.title).toBe('Analyze a Question · Shikho English'));

  await userEvent.click(screen.getAllByRole('link', { name: 'History' })[0]!);

  await waitFor(() => expect(document.getElementById('main-content')).toHaveFocus());
  expect(document.title).toBe('Question History · Shikho English');
});

test('the first page load leaves focus alone', () => {
  renderApp('/');
  expect(document.getElementById('main-content')).not.toHaveFocus();
});

test('a query-string change (paging) keeps focus where it is', async () => {
  signIn();
  renderApp('/history?page=2');

  const next = await screen.findByRole('button', { name: 'Next' });
  await userEvent.click(next);

  await waitFor(() => expect(window.location.search).toBe('?page=3'));
  expect(document.getElementById('main-content')).not.toHaveFocus();
});

test('a #faq address focuses the FAQ section, even on first load', async () => {
  renderApp('/#faq');

  await waitFor(() => expect(document.getElementById('faq')).toHaveFocus());
});

test('the footer FAQ link jumps to the FAQ from another page', async () => {
  renderApp('/topics');

  await userEvent.click(within(screen.getByRole('navigation', { name: 'Help' })).getByRole('link', { name: 'Questions students ask' }));

  await waitFor(() => expect(document.getElementById('faq')).toHaveFocus());
  expect(window.location.pathname).toBe('/');
});

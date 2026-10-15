import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import TopicsPage from './TopicsPage';
import SettingsPage from './SettingsPage';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { PracticeProvider } from '../context/PracticeContext';
import { jsonResponse, mockApi, problemResponse, renderWithProviders, signIn, testUser } from '../test/utils';
import type { Topic, TopicProgress } from '../types/api';

const topics: Topic[] = [
  { code: 'articles', nameEn: 'Articles', nameBn: 'আর্টিকেল' },
  { code: 'narration', nameEn: 'Narration (Direct and Indirect Speech)', nameBn: 'উক্তি পরিবর্তন' },
  { code: 'other', nameEn: 'Other', nameBn: 'অন্যান্য' }
];

const progress = (code: string, overrides: Partial<TopicProgress> = {}): TopicProgress => ({
  topic: topics.find((t) => t.code === code)!,
  questionsAnalysed: 0,
  practiceAnswered: 0,
  answersMarked: 0,
  answersCorrect: 0,
  accuracyPercentage: null,
  needsPractice: false,
  lastActivityAt: null,
  ...overrides
});

describe('TopicsPage', () => {
  test('a visitor sees every topic and is asked to log in to practise it', async () => {
    mockApi({ 'GET /topics': () => jsonResponse(topics) });
    renderWithProviders(<TopicsPage />, { route: '/topics' });

    const articles = await screen.findByTestId('topic-articles');
    expect(within(articles).getByRole('heading', { name: 'Articles' })).toBeInTheDocument();
    expect(within(articles).getByText('আর্টিকেল')).toHaveAttribute('lang', 'bn');
    expect(within(articles).getByRole('link', { name: /Log in to practise/ })).toHaveAttribute(
      'href',
      '/login?next=%2Fanalyze%3Ftopic%3Darticles'
    );
    expect(screen.queryByTestId('topic-other')).not.toBeInTheDocument();
  });

  test('a student sees their progress and can analyze in a topic', async () => {
    signIn();
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'GET /progress/topics': () =>
        jsonResponse([
          progress('articles', { questionsAnalysed: 3, accuracyPercentage: 40, needsPractice: true }),
          progress('narration')
        ])
    });
    renderWithProviders(<TopicsPage />, { route: '/topics' });

    const articles = await screen.findByTestId('topic-articles');
    expect(await within(articles).findByText('3 questions analysed · 40% correct')).toBeInTheDocument();
    expect(within(articles).getByText('Needs practice')).toBeInTheDocument();
    expect(within(articles).getByRole('link', { name: 'Analyze a question in Articles' })).toHaveAttribute('href', '/analyze?topic=articles');
    expect(within(screen.getByTestId('topic-narration')).getByText('Not started yet')).toBeInTheDocument();
  });

  test('topics stay usable when progress cannot be loaded', async () => {
    signIn();
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'GET /progress/topics': () => problemResponse(500, 'Something went wrong on our side.')
    });
    renderWithProviders(<TopicsPage />, { route: '/topics' });

    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load your progress');
    expect(screen.getByTestId('topic-articles')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  test('a failed topic load can be retried', async () => {
    let calls = 0;
    mockApi({ 'GET /topics': () => (++calls === 1 ? problemResponse(503, 'Database unavailable') : jsonResponse(topics)) });
    renderWithProviders(<TopicsPage />, { route: '/topics' });

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByTestId('topic-articles')).toBeInTheDocument();
  });
});

describe('SettingsPage', () => {
  test('shows the account details read-only', () => {
    signIn();
    renderWithProviders(<SettingsPage />, { route: '/settings' });

    expect(screen.getByText(testUser.email)).toBeInTheDocument();
    expect(screen.getByText(testUser.username)).toBeInTheDocument();
    expect(screen.getByText('Your details and password can’t be changed in the app.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('switching the explanation language is remembered', async () => {
    signIn();
    renderWithProviders(<SettingsPage />, { route: '/settings' });

    await userEvent.click(screen.getByRole('button', { name: 'বাংলা' }));

    expect(localStorage.getItem('explanationLanguage')).toBe('bn');
  });
});

describe('Settings and topics in the app', () => {
  beforeEach(() => {
    mockApi({ 'GET /topics': () => jsonResponse(topics) });
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

  test('settings needs a signed-in student', async () => {
    renderApp('/settings');

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get('next')).toBe('/settings');
  });

  test('logging out from settings goes home', async () => {
    signIn();
    renderApp('/settings');

    await userEvent.click(within(screen.getByRole('main')).getByRole('button', { name: 'Log out' }));

    expect(window.location.pathname).toBe('/');
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('the topics page is public', async () => {
    renderApp('/topics');

    expect(await screen.findByRole('heading', { level: 1, name: 'Grammar topics' })).toBeInTheDocument();
  });
});

describe('Navbar links', () => {
  test('a visitor can reach the topics', () => {
    renderWithProviders(<Navbar />);

    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Topics' })).toHaveAttribute('href', '/topics');
  });

  test('the account menu leads to settings', async () => {
    signIn();
    renderWithProviders(<Navbar />);

    await userEvent.click(screen.getByRole('button', { name: 'Account menu for Test Student' }));

    expect(within(document.getElementById('account-menu')!).getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
  });
});

import { describe, expect, test } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import AnalyzePage from './AnalyzePage';
import QuestionDetailPage from './QuestionDetailPage';
import PracticeSetButton from '../components/PracticeSetButton';
import { jsonResponse, mockApi, problemResponse, renderWithProviders, signIn } from '../test/utils';
import type { QuestionAnalysis, Topic } from '../types/api';

const topics: Topic[] = [
  { code: 'articles', nameEn: 'Articles', nameBn: 'আর্টিকেল' },
  { code: 'narration', nameEn: 'Narration (Direct and Indirect Speech)', nameBn: 'উক্তি পরিবর্তন' }
];

const analysis: QuestionAnalysis = {
  id: 5,
  topic: topics[0]!,
  questionText: 'She is ___ honest girl.',
  correctAnswer: 'an',
  steps: [{ en: 'The h is silent.', bn: 'h উচ্চারিত হয় না।' }],
  rule: { en: 'Use an before a vowel sound.', bn: 'স্বরধ্বনির আগে an বসে।' },
  commonMistakes: [],
  studentAnswer: null,
  createdAt: '2026-10-16T08:00:00Z'
};

const rateLimited = (retryAfter?: string) => {
  const response = problemResponse(429, 'You are going too fast. Please wait a minute and try again.', 'Too many requests');
  if (retryAfter) response.headers.set('Retry-After', retryAfter);
  return response;
};

describe('AnalyzePage states', () => {
  test('a rate-limited request explains the wait and retries only when asked', async () => {
    signIn();
    let calls = 0;
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'POST /questions/analyze': () => (++calls === 1 ? rateLimited() : jsonResponse(analysis))
    });
    renderWithProviders(<AnalyzePage />, { route: '/analyze' });

    await userEvent.type(screen.getByLabelText('Question'), 'She is ___ honest girl.');
    await userEvent.click(screen.getByRole('button', { name: 'Analyze' }));

    expect(await screen.findByText('Too many requests')).toBeInTheDocument();
    expect(screen.getByText(/Please wait a minute, then try again/)).toBeInTheDocument();
    expect(calls).toBe(1);

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Use an before a vowel sound.')).toBeInTheDocument();
    expect(calls).toBe(2);
  });

  test('a rate limit with a known wait disables retrying until it is over', async () => {
    signIn();
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'POST /questions/analyze': () => rateLimited('30')
    });
    renderWithProviders(<AnalyzePage />, { route: '/analyze' });

    await userEvent.type(screen.getByLabelText('Question'), 'She is ___ honest girl.');
    await userEvent.click(screen.getByRole('button', { name: 'Analyze' }));

    expect(await screen.findByText(/Please wait about 30 seconds/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeDisabled();
  });

  test('preselects a known topic from the address and sends it', async () => {
    signIn();
    const fetchMock = mockApi({
      'GET /topics': () => jsonResponse(topics),
      'POST /questions/analyze': () => jsonResponse(analysis)
    });
    renderWithProviders(<AnalyzePage />, { route: '/analyze?topic=narration' });

    await screen.findByRole('option', { name: /Narration/ });
    expect(screen.getByLabelText('Topic (optional)')).toHaveValue('narration');

    await userEvent.type(screen.getByLabelText('Question'), 'He said, "I am busy."');
    await userEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    await screen.findByRole('article');

    const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/questions/analyze'))!;
    expect(JSON.parse(String(call[1]?.body))).toMatchObject({ topicCode: 'narration' });
  });

  test('ignores an unknown topic in the address', async () => {
    signIn();
    mockApi({ 'GET /topics': () => jsonResponse(topics) });
    renderWithProviders(<AnalyzePage />, { route: '/analyze?topic=made-up' });

    await screen.findByRole('option', { name: /Narration/ });
    expect(screen.getByLabelText('Topic (optional)')).toHaveValue('');
  });

  test('moves focus to the new explanation', async () => {
    signIn();
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'POST /questions/analyze': () => jsonResponse(analysis)
    });
    renderWithProviders(<AnalyzePage />, { route: '/analyze' });

    await userEvent.type(screen.getByLabelText('Question'), 'She is ___ honest girl.');
    await userEvent.click(screen.getByRole('button', { name: 'Analyze' }));

    await waitFor(() => expect(screen.getByRole('article')).toHaveFocus());
  });
});

describe('QuestionDetailPage states', () => {
  const renderDetail = (id: string) =>
    renderWithProviders(
      <Routes>
        <Route path="/questions/:id" element={<QuestionDetailPage />} />
      </Routes>,
      { route: `/questions/${id}` }
    );

  test('a missing question offers a way on, not a pointless retry', async () => {
    signIn();
    mockApi({ 'GET /questions/99': () => problemResponse(404, 'Question not found', 'Not Found') });
    renderDetail('99');

    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t find this question');
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Analyze a new question' })).toHaveAttribute('href', '/analyze');
  });

  test('a server error can be retried by hand', async () => {
    signIn();
    let calls = 0;
    mockApi({
      'GET /questions/5': () => (++calls === 1 ? problemResponse(500, 'Something went wrong on our side.') : jsonResponse(analysis))
    });
    renderDetail('5');

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('article')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Articles' })).toBeInTheDocument();
    expect(calls).toBe(2);
  });
});

test('PracticeSetButton explains a rate limit', async () => {
  signIn();
  mockApi({ 'POST /questions/5/practice-set': () => rateLimited() });
  renderWithProviders(<PracticeSetButton analysisId={5} />, { route: '/questions/5' });

  await userEvent.click(screen.getByRole('button', { name: 'Practice 3 similar questions' }));

  expect(await screen.findByText('Too many requests')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Practice 3 similar questions' })).toBeEnabled();
});

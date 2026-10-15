import { describe, expect, test } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import PracticePage from './PracticePage';
import PracticeSetPage from './PracticeSetPage';
import QuizComponent from '../components/QuizComponent';
import { jsonResponse, mockApi, problemResponse, renderWithProviders, signIn } from '../test/utils';
import type { PracticeResult, Quiz, QuizQuestion } from '../types/api';

const practice = (id: number, overrides: Partial<PracticeResult> = {}): PracticeResult => ({
  id,
  originalSentence: `Sentence number ${id}.`,
  correctedSentence: `Sentence number ${id}.`,
  mistakes: [],
  explanation: 'Looks good.',
  isCorrect: true,
  createdAt: '2026-10-16T08:00:00Z',
  ...overrides
});

const corrected = practice(100, {
  originalSentence: 'She is a honest girl.',
  correctedSentence: 'She is an honest girl.',
  mistakes: [{ type: 'article error', original: 'a honest', correction: 'an honest', reason: 'Honest starts with a vowel sound.' }],
  explanation: "Use 'an' before a vowel sound.",
  isCorrect: false
});

describe('Sentence Check', () => {
  test('Enter checks the sentence and the changes are marked', async () => {
    signIn();
    const fetchMock = mockApi({
      'GET /practice/history': () => jsonResponse([]),
      'POST /practice/submit': () => jsonResponse(corrected)
    });
    renderWithProviders(<PracticePage />, { route: '/practice' });

    await userEvent.type(screen.getByLabelText(/enter a sentence/i), 'She is a honest girl.{Enter}');

    const result = await screen.findByRole('article');
    expect(within(result).getByText('1 mistake found', { exact: false })).toBeInTheDocument();
    expect(result.querySelector('del')).toHaveTextContent('removed: a');
    expect(result.querySelector('ins')).toHaveTextContent('added: an');
    const submit = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/practice/submit'))!;
    expect(JSON.parse(String(submit[1]?.body))).toEqual({ sentence: 'She is a honest girl.' });
    await waitFor(() => expect(result).toHaveFocus());
  });

  test('Shift+Enter adds a line instead of checking', async () => {
    signIn();
    const fetchMock = mockApi({ 'GET /practice/history': () => jsonResponse([]) });
    renderWithProviders(<PracticePage />, { route: '/practice' });

    const input = screen.getByLabelText(/enter a sentence/i);
    await userEvent.type(input, 'First line{Shift>}{Enter}{/Shift}second line');

    expect(input).toHaveValue('First line\nsecond line');
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/practice/submit'))).toBe(false);
  });

  test('loading the history does not pretend a sentence is being checked', () => {
    signIn();
    mockApi({ 'GET /practice/history': () => new Promise<Response>(() => {}) as unknown as Response });
    renderWithProviders(<PracticePage />, { route: '/practice' });

    expect(screen.queryByText('Checking your sentence…')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check Grammar' })).toBeDisabled();
  });

  test('history shows the five most recent checks until asked for more', async () => {
    signIn();
    mockApi({ 'GET /practice/history': () => jsonResponse([1, 2, 3, 4, 5, 6, 7].map((id) => practice(id))) });
    renderWithProviders(<PracticePage />, { route: '/practice' });

    const history = await screen.findByRole('region', { name: 'Recent checks' });
    expect(within(history).getAllByRole('listitem')).toHaveLength(5);

    await userEvent.click(within(history).getByRole('button', { name: 'Show all 7' }));

    expect(within(history).getAllByRole('listitem')).toHaveLength(7);
    expect(within(history).getByRole('button', { name: 'Show fewer' })).toHaveAttribute('aria-expanded', 'true');
  });
});

const articleQuestion = (id: number, answered = false): QuizQuestion => ({
  id,
  question: 'Choose the correct article',
  incorrectSentence: `Sentence ${id}: I saw ___ owl.`,
  correctAnswer: answered ? 'an' : null,
  userAnswer: answered ? 'an' : null,
  isAnsweredCorrectly: answered ? true : null,
  explanation: answered ? 'Owl starts with a vowel sound.' : null,
  answerType: 'articles',
  explanationBn: null,
  feedbackEn: null,
  feedbackBn: null
});

const articleQuiz = (questions: QuizQuestion[]): Quiz => ({
  id: 12,
  title: 'Grammar Quiz - 2026-10-16 08:00',
  score: questions.filter((q) => q.isAnsweredCorrectly).length,
  totalQuestions: questions.length,
  isCompleted: questions.every((q) => q.userAnswer),
  createdAt: '2026-10-16T08:00:00Z',
  completedAt: null,
  questions,
  topic: null,
  sourceAnalysisId: null
});

const renderSaved = (id: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/practice-sets/:id" element={<PracticeSetPage />} />
    </Routes>,
    { route: `/practice-sets/${id}` }
  );

describe('saved article quiz', () => {
  test('resumes with a, an and the, in English only, and reviews every answer at the end', async () => {
    signIn();
    let state = articleQuiz([articleQuestion(1, true), articleQuestion(2)]);
    mockApi({
      'GET /quiz/12': () => jsonResponse(state),
      'POST /quiz/12/answer': () => {
        state = articleQuiz([articleQuestion(1, true), articleQuestion(2, true)]);
        return jsonResponse(state);
      }
    });
    renderSaved('12');

    expect(await screen.findByText('Sentence 2: I saw ___ owl.')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Explanation language' })).not.toBeInTheDocument();

    await userEvent.click(within(screen.getByRole('group', { name: 'Choose an article' })).getByRole('button', { name: 'an' }));

    const feedback = await screen.findByText('✓ Correct!');
    await waitFor(() => expect(feedback.parentElement).toHaveFocus());

    await userEvent.click(screen.getByRole('button', { name: 'See Results' }));
    expect(screen.getByRole('heading', { name: 'Quiz Completed!' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start a new quiz' })).toHaveAttribute('href', '/quiz');
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByText('Sentence 1: I saw ___ owl.', { exact: false })).toBeInTheDocument();
  });

  test('a missing practice set offers a way on, not a retry', async () => {
    signIn();
    mockApi({ 'GET /quiz/404': () => problemResponse(404, 'Quiz not found', 'Not Found') });
    renderSaved('404');

    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t find this practice set');
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});

test('a rate-limited quiz start explains the wait', async () => {
  signIn();
  mockApi({ 'POST /quiz/create': () => problemResponse(429, 'You are going too fast.', 'Too many requests') });
  renderWithProviders(<QuizComponent />, { route: '/quiz' });

  await userEvent.click(screen.getByRole('button', { name: 'Start Quiz' }));

  expect(await screen.findByText('Too many requests')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Start Quiz' })).toBeEnabled();
});

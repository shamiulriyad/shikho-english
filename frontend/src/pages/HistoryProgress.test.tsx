import { describe, expect, test } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryPage from './HistoryPage';
import ProgressDashboard from '../components/ProgressDashboard';
import RecentPracticeList from '../components/RecentPracticeList';
import { jsonResponse, mockApi, problemResponse, renderWithProviders, signIn } from '../test/utils';
import type { PagedResult, Quiz, QuizQuestion, QuestionAnalysisSummary, Topic, UserProgress } from '../types/api';

const topics: Topic[] = [
  { code: 'articles', nameEn: 'Articles', nameBn: 'আর্টিকেল' },
  { code: 'narration', nameEn: 'Narration (Direct and Indirect Speech)', nameBn: 'উক্তি পরিবর্তন' }
];

const summary = (id: number, questionText: string): QuestionAnalysisSummary => ({
  id,
  topic: topics[0]!,
  questionText,
  correctAnswer: 'an',
  studentAnswerIsCorrect: null,
  createdAt: '2026-10-16T08:00:00Z'
});

const page = (items: QuestionAnalysisSummary[], pageNumber: number, totalCount: number): PagedResult<QuestionAnalysisSummary> =>
  ({ items, page: pageNumber, pageSize: 10, totalCount });

describe('HistoryPage address', () => {
  test('page changes are kept in the address', async () => {
    signIn();
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'GET /questions/history': (_init, url) =>
        jsonResponse(url.searchParams.get('page') === '2' ? page([summary(1, 'Oldest question')], 2, 11) : page([summary(11, 'Newest question')], 1, 11))
    });
    renderWithProviders(<HistoryPage />, { route: '/history' });

    await screen.findByText('Newest question');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Oldest question')).toBeInTheDocument();
    expect(screen.getByTestId('location-search')).toHaveTextContent('?page=2');
  });

  test('opens the page and topic named in the address', async () => {
    signIn();
    const requests: string[] = [];
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'GET /questions/history': (_init, url) => {
        requests.push(url.search);
        return jsonResponse(page([summary(30, 'A narration question')], 2, 11));
      }
    });
    renderWithProviders(<HistoryPage />, { route: '/history?topic=narration&page=2' });

    expect(await screen.findByText('A narration question')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(requests).toEqual(['?page=2&pageSize=10&topic=narration']);
  });

  test.each(['0', '-3', 'abc', '1.5'])('treats page=%s as the first page', async (raw) => {
    signIn();
    const requests: string[] = [];
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'GET /questions/history': (_init, url) => {
        requests.push(url.search);
        return jsonResponse(page([summary(11, 'Newest question')], 1, 1));
      }
    });
    renderWithProviders(<HistoryPage />, { route: `/history?page=${raw}` });

    await screen.findByText('Newest question');
    expect(requests).toEqual(['?page=1&pageSize=10']);
  });

  test('an empty topic offers to show all topics again', async () => {
    signIn();
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'GET /questions/history': (_init, url) =>
        jsonResponse(url.searchParams.get('topic') ? page([], 1, 0) : page([summary(11, 'Newest question')], 1, 1))
    });
    renderWithProviders(<HistoryPage />, { route: '/history?topic=narration' });

    await userEvent.click(await screen.findByRole('button', { name: 'Show all topics' }));

    expect(await screen.findByText('Newest question')).toBeInTheDocument();
    expect(screen.getByTestId('location-search')).toBeEmptyDOMElement();
  });

  test('a page past the end offers the first page', async () => {
    signIn();
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'GET /questions/history': () => jsonResponse(page([], 9, 3))
    });
    renderWithProviders(<HistoryPage />, { route: '/history?page=9' });

    expect(await screen.findByRole('button', { name: 'Go to the first page' })).toBeInTheDocument();
  });

  test('a failed load can be retried', async () => {
    signIn();
    let calls = 0;
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'GET /questions/history': () => (++calls === 1 ? problemResponse(500, 'Something went wrong on our side.') : jsonResponse(page([summary(11, 'Newest question')], 1, 1)))
    });
    renderWithProviders(<HistoryPage />, { route: '/history' });

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Newest question')).toBeInTheDocument();
  });
});

const totals = (overrides: Partial<UserProgress> = {}): UserProgress => ({
  totalPractices: 0,
  correctPractices: 0,
  correctPercentage: 0,
  totalQuizzes: 0,
  averageQuizScore: 0,
  correctArticleCount: 0,
  totalArticleCount: 0,
  ...overrides
});

describe('ProgressDashboard', () => {
  test('says the average covers quizzes and practice sets', async () => {
    signIn();
    mockApi({ 'GET /practice/progress': () => jsonResponse(totals({ totalQuizzes: 2, averageQuizScore: 50 })) });
    renderWithProviders(<ProgressDashboard />, { route: '/progress' });

    expect(await screen.findByText('Across 2 completed quizzes and practice sets')).toBeInTheDocument();
  });

  test('shows a dash, not 0%, before anything is done', async () => {
    signIn();
    mockApi({ 'GET /practice/progress': () => jsonResponse(totals()) });
    renderWithProviders(<ProgressDashboard />, { route: '/progress' });

    expect(await screen.findByText('Finish a quiz or practice set to see this')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument();
  });

  test('reports a failure instead of hiding it', async () => {
    signIn();
    mockApi({ 'GET /practice/progress': () => problemResponse(500, 'Something went wrong on our side.') });
    renderWithProviders(<ProgressDashboard />, { route: '/progress' });

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on our side.');
  });
});

const question = (id: number, answered: boolean): QuizQuestion => ({
  id,
  question: 'Choose the correct article',
  incorrectSentence: 'I saw ___ owl.',
  correctAnswer: answered ? 'an' : null,
  userAnswer: answered ? 'an' : null,
  isAnsweredCorrectly: answered ? true : null,
  explanation: null,
  answerType: 'articles',
  explanationBn: null,
  feedbackEn: null,
  feedbackBn: null
});

const quiz = (id: number, answered: number, total: number, practiceSet = false): Quiz => ({
  id,
  title: practiceSet ? `Practice: Articles ${id}` : `Grammar Quiz ${id}`,
  score: answered,
  totalQuestions: total,
  isCompleted: answered === total,
  createdAt: '2026-10-16T08:00:00Z',
  completedAt: null,
  questions: Array.from({ length: total }, (_, i) => question(id * 10 + i, i < answered)),
  topic: practiceSet ? topics[0]! : null,
  sourceAnalysisId: practiceSet ? 5 : null
});

describe('RecentPracticeList', () => {
  test('continues unfinished work and reviews finished work', async () => {
    signIn();
    mockApi({ 'GET /quiz/user/all': () => jsonResponse([quiz(2, 1, 5), quiz(1, 3, 3, true)]) });
    renderWithProviders(<RecentPracticeList />, { route: '/progress' });

    expect(await screen.findByRole('link', { name: 'Continue: Grammar Quiz 2' })).toHaveAttribute('href', '/practice-sets/2');
    expect(screen.getByText('1 of 5 answered')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review: Practice: Articles 1' })).toHaveAttribute('href', '/practice-sets/1');
    expect(screen.getByText('Score 3 / 3')).toBeInTheDocument();
    expect(screen.getByText('Practice set · Articles')).toBeInTheDocument();
  });

  test('shows five, then all on request', async () => {
    signIn();
    mockApi({ 'GET /quiz/user/all': () => jsonResponse([1, 2, 3, 4, 5, 6].map((id) => quiz(id, 1, 1))) });
    renderWithProviders(<RecentPracticeList />, { route: '/progress' });

    const section = await screen.findByRole('region', { name: 'Recent quizzes and practice sets' });
    expect(within(section).getAllByRole('listitem')).toHaveLength(5);
    await userEvent.click(within(section).getByRole('button', { name: 'Show all 6' }));
    await waitFor(() => expect(within(section).getAllByRole('listitem')).toHaveLength(6));
  });

  test('suggests a first quiz when there is none', async () => {
    signIn();
    mockApi({ 'GET /quiz/user/all': () => jsonResponse([]) });
    renderWithProviders(<RecentPracticeList />, { route: '/progress' });

    expect(await screen.findByRole('link', { name: 'Take a quiz' })).toHaveAttribute('href', '/quiz');
  });
});

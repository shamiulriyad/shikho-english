import { describe, expect, test } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import AnalyzePage from './AnalyzePage';
import HistoryPage from './HistoryPage';
import QuestionDetailPage from './QuestionDetailPage';
import { jsonResponse, mockApi, problemResponse, renderWithProviders, signIn } from '../test/utils';
import type { PagedResult, QuestionAnalysis, QuestionAnalysisSummary, Topic } from '../types/api';

const topics: Topic[] = [
  { code: 'articles', nameEn: 'Articles', nameBn: 'আর্টিকেল' },
  { code: 'narration', nameEn: 'Narration (Direct and Indirect Speech)', nameBn: 'উক্তি পরিবর্তন' }
];

const analysis: QuestionAnalysis = {
  id: 5,
  topic: topics[0]!,
  questionText: 'She is ___ honest girl.',
  correctAnswer: 'an',
  steps: [
    { en: 'Look at the word after the blank.', bn: 'শূন্যস্থানের পরের শব্দটি দেখো।' },
    { en: 'The h is silent.', bn: 'h উচ্চারিত হয় না।' }
  ],
  rule: { en: 'Use an before a vowel sound.', bn: 'স্বরধ্বনির আগে an বসে।' },
  commonMistakes: [{ en: 'Choosing a by spelling.', bn: 'বানান দেখে a বসানো।' }],
  studentAnswer: null,
  createdAt: '2026-10-16T08:00:00Z'
};

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

describe('AnalyzePage', () => {
  test('sends the question and shows the answer, steps and rule in English by default', async () => {
    signIn();
    const fetchMock = mockApi({
      'GET /topics': () => jsonResponse(topics),
      'POST /questions/analyze': () => jsonResponse(analysis)
    });
    renderWithProviders(<AnalyzePage />, { route: '/analyze' });

    expect(await screen.findByRole('option', { name: 'Articles (আর্টিকেল)' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Question'), 'She is ___ honest girl.');
    await userEvent.click(screen.getByRole('button', { name: 'Analyze' }));

    expect(await screen.findByText('Use an before a vowel sound.')).toBeInTheDocument();
    expect(screen.getByText('Look at the word after the blank.')).toBeInTheDocument();
    expect(screen.getByText('Choosing a by spelling.')).toBeInTheDocument();
    expect(screen.getByText('an')).toBeInTheDocument();
    expect(screen.getByText(/AI-generated explanation/)).toBeInTheDocument();

    const analyzeCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/questions/analyze'))!;
    expect(JSON.parse(String(analyzeCall[1]?.body))).toEqual({
      questionText: 'She is ___ honest girl.',
      topicCode: null,
      studentAnswer: null
    });
  });

  test('switching to Bangla shows the Bangla explanation and is remembered', async () => {
    signIn();
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'POST /questions/analyze': () => jsonResponse(analysis)
    });
    renderWithProviders(<AnalyzePage />, { route: '/analyze' });

    await userEvent.type(screen.getByLabelText('Question'), 'She is ___ honest girl.');
    await userEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    const bangla = await screen.findByRole('button', { name: 'বাংলা' });
    expect(bangla).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(bangla);

    expect(bangla).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('স্বরধ্বনির আগে an বসে।')).toBeInTheDocument();
    expect(screen.getByText('শূন্যস্থানের পরের শব্দটি দেখো।')).toBeInTheDocument();
    expect(screen.getByText('ব্যাকরণের নিয়ম')).toBeInTheDocument();
    expect(screen.queryByText('Use an before a vowel sound.')).not.toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveAttribute('lang', 'bn');
    expect(localStorage.getItem('explanationLanguage')).toBe('bn');
  });

  test('sends the chosen topic and the student answer, and shows the feedback', async () => {
    signIn();
    const fetchMock = mockApi({
      'GET /topics': () => jsonResponse(topics),
      'POST /questions/analyze': () => jsonResponse({
        ...analysis,
        studentAnswer: { answer: 'a', isCorrect: false, en: 'a is wrong before a vowel sound.', bn: 'স্বরধ্বনির আগে a ভুল।' }
      })
    });
    renderWithProviders(<AnalyzePage />, { route: '/analyze' });

    await screen.findByRole('option', { name: 'Articles (আর্টিকেল)' });
    await userEvent.type(screen.getByLabelText('Question'), 'She is ___ honest girl.');
    await userEvent.selectOptions(screen.getByLabelText('Topic (optional)'), 'articles');
    await userEvent.type(screen.getByLabelText('Your answer (optional)'), 'a');
    await userEvent.click(screen.getByRole('button', { name: 'Analyze' }));

    expect(await screen.findByText('✗ Not quite')).toBeInTheDocument();
    expect(screen.getByText('a is wrong before a vowel sound.')).toBeInTheDocument();
    const analyzeCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/questions/analyze'))!;
    expect(JSON.parse(String(analyzeCall[1]?.body))).toMatchObject({ topicCode: 'articles', studentAnswer: 'a' });
  });

  test('shows the server message when the AI is unavailable', async () => {
    signIn();
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'POST /questions/analyze': () => problemResponse(503, 'The AI service is currently unavailable. Please try again later.')
    });
    renderWithProviders(<AnalyzePage />, { route: '/analyze' });

    await userEvent.type(screen.getByLabelText('Question'), 'She is ___ honest girl.');
    await userEvent.click(screen.getByRole('button', { name: 'Analyze' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The AI service is currently unavailable. Please try again later.');
  });

  test('cannot submit an empty or too short question', async () => {
    signIn();
    mockApi({ 'GET /topics': () => jsonResponse(topics) });
    renderWithProviders(<AnalyzePage />, { route: '/analyze' });

    const button = screen.getByRole('button', { name: 'Analyze' });
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Question'), 'ab');
    expect(button).toBeDisabled();
  });

  test('a remembered Bangla preference applies straight away', async () => {
    signIn();
    localStorage.setItem('explanationLanguage', 'bn');
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'POST /questions/analyze': () => jsonResponse(analysis)
    });
    renderWithProviders(<AnalyzePage />, { route: '/analyze' });

    await userEvent.type(screen.getByLabelText('Question'), 'She is ___ honest girl.');
    await userEvent.click(screen.getByRole('button', { name: 'Analyze' }));

    expect(await screen.findByText('স্বরধ্বনির আগে an বসে।')).toBeInTheDocument();
  });
});

describe('HistoryPage', () => {
  test('lists past questions, pages through them and filters by topic', async () => {
    signIn();
    const historyRequests: string[] = [];
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'GET /questions/history': (_init, url) => {
        historyRequests.push(url.search);
        const pageNumber = Number(url.searchParams.get('page'));
        if (url.searchParams.get('topic') === 'narration') {
          return jsonResponse(page([summary(30, 'A narration question')], 1, 1));
        }
        return jsonResponse(pageNumber === 1
          ? page([summary(12, 'Newest question'), summary(11, 'Older question')], 1, 12)
          : page([summary(1, 'Oldest question')], 2, 12));
      }
    });
    renderWithProviders(<HistoryPage />, { route: '/history' });

    const newest = await screen.findByRole('link', { name: /Newest question/ });
    expect(newest).toHaveAttribute('href', '/questions/12');
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Oldest question')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    await screen.findByRole('option', { name: 'Articles' });
    await userEvent.selectOptions(screen.getByLabelText('Topic'), 'narration');
    expect(await screen.findByText('A narration question')).toBeInTheDocument();
    expect(historyRequests).toEqual(['?page=1&pageSize=10', '?page=2&pageSize=10', '?page=1&pageSize=10&topic=narration']);
  });

  test('suggests analysing a first question when the history is empty', async () => {
    signIn();
    mockApi({
      'GET /topics': () => jsonResponse(topics),
      'GET /questions/history': () => jsonResponse(page([], 1, 0))
    });
    renderWithProviders(<HistoryPage />, { route: '/history' });

    expect(await screen.findByRole('link', { name: 'Analyze your first question' })).toHaveAttribute('href', '/analyze');
  });
});

describe('QuestionDetailPage', () => {
  const renderDetail = (id: string) =>
    renderWithProviders(
      <Routes>
        <Route path="/questions/:id" element={<QuestionDetailPage />} />
      </Routes>,
      { route: `/questions/${id}` }
    );

  test('shows a saved analysis', async () => {
    signIn();
    mockApi({ 'GET /questions/5': () => jsonResponse(analysis) });

    renderDetail('5');

    const result = await screen.findByRole('article');
    expect(within(result).getByText('Use an before a vowel sound.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Back to history' })).toHaveAttribute('href', '/history');
  });

  test("shows the server message for someone else's or a missing question", async () => {
    signIn();
    mockApi({ 'GET /questions/99': () => problemResponse(404, 'Question not found', 'Not Found') });

    renderDetail('99');

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Question not found'));
  });
});

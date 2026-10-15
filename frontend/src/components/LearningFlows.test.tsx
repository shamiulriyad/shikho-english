import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizComponent from './QuizComponent';
import PracticeSentenceInput from './PracticeSentenceInput';
import ProgressDashboard from './ProgressDashboard';
import { jsonResponse, mockFetch, problemResponse, renderWithProviders, signIn } from '../test/utils';
import type { PracticeResult, Quiz } from '../types/api';

const unansweredQuiz: Quiz = {
  id: 7,
  title: 'Grammar Quiz',
  score: 0,
  totalQuestions: 1,
  isCompleted: false,
  createdAt: '2026-10-15T00:00:00Z',
  completedAt: null,
  questions: [{
    id: 70,
    question: 'Choose the correct article',
    incorrectSentence: 'She is ___ honest girl.',
    correctAnswer: null,
    userAnswer: null,
    isAnsweredCorrectly: null,
    explanation: null,
    answerType: 'articles',
    explanationBn: null,
    feedbackEn: null,
    feedbackBn: null
  }],
  topic: null,
  sourceAnalysisId: null
};

const answeredQuiz: Quiz = {
  ...unansweredQuiz,
  score: 1,
  isCompleted: true,
  completedAt: '2026-10-15T00:01:00Z',
  questions: [{
    ...unansweredQuiz.questions[0]!,
    correctAnswer: 'an',
    userAnswer: 'an',
    isAnsweredCorrectly: true,
    explanation: "Use 'an' before a vowel sound."
  }]
};

describe('QuizComponent', () => {
  test('creates a quiz, submits an answer and shows the result', async () => {
    signIn();
    const fetchMock = mockFetch(jsonResponse(unansweredQuiz), jsonResponse(answeredQuiz));
    renderWithProviders(<QuizComponent />, { route: '/quiz' });

    await userEvent.click(screen.getByRole('button', { name: 'Start Quiz' }));
    expect(await screen.findByText('She is ___ honest girl.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'an' }));
    expect(await screen.findByText('✓ Correct!')).toBeInTheDocument();
    expect(screen.getByText("Use 'an' before a vowel sound.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'See Results' }));
    expect(screen.getByText('100.0%')).toBeInTheDocument();

    expect(fetchMock.mock.calls[0]![0]).toMatch(/\/quiz\/create$/);
    expect(fetchMock.mock.calls[1]![0]).toMatch(/\/quiz\/7\/answer$/);
    expect(JSON.parse(String(fetchMock.mock.calls[1]![1]?.body))).toEqual({ questionId: 70, answer: 'an' });
  });

  test('shows the AI unavailable message when quiz creation fails', async () => {
    signIn();
    mockFetch(problemResponse(503, 'The AI service is currently unavailable. Please try again later.'));
    renderWithProviders(<QuizComponent />, { route: '/quiz' });

    await userEvent.click(screen.getByRole('button', { name: 'Start Quiz' }));

    expect(await screen.findByText('The AI service is currently unavailable. Please try again later.')).toBeInTheDocument();
  });
});

describe('PracticeSentenceInput', () => {
  test('shows corrections returned by the API', async () => {
    signIn();
    const result: PracticeResult = {
      id: 3,
      originalSentence: 'She is a honest girl.',
      correctedSentence: 'She is an honest girl.',
      mistakes: [{ type: 'article error', original: 'a honest', correction: 'an honest', reason: 'Vowel sound.' }],
      explanation: "Use 'an' before a vowel sound.",
      isCorrect: false,
      createdAt: '2026-10-15T00:00:00Z'
    };
    mockFetch(jsonResponse(result));
    renderWithProviders(<PracticeSentenceInput />, { route: '/practice' });

    await userEvent.type(screen.getByLabelText(/enter a sentence/i), 'She is a honest girl.');
    await userEvent.click(screen.getByRole('button', { name: 'Check Grammar' }));

    expect(await screen.findByText('She is an honest girl.')).toBeInTheDocument();
    expect(screen.getByText('a honest')).toBeInTheDocument();
  });

  test('shows the AI unavailable message on 503', async () => {
    signIn();
    mockFetch(problemResponse(503, 'The AI service is currently unavailable. Please try again later.'));
    renderWithProviders(<PracticeSentenceInput />, { route: '/practice' });

    await userEvent.type(screen.getByLabelText(/enter a sentence/i), 'a apple');
    await userEvent.click(screen.getByRole('button', { name: 'Check Grammar' }));

    expect(await screen.findByText('The AI service is currently unavailable. Please try again later.')).toBeInTheDocument();
  });
});

describe('ProgressDashboard', () => {
  test('renders progress numbers from the API', async () => {
    signIn();
    mockFetch(jsonResponse({
      totalPractices: 4,
      correctPractices: 3,
      correctPercentage: 75,
      totalQuizzes: 2,
      averageQuizScore: 50,
      correctArticleCount: 3,
      totalArticleCount: 4
    }));
    renderWithProviders(<ProgressDashboard />, { route: '/progress' });

    expect(await screen.findByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});

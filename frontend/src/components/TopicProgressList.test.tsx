import { describe, expect, test } from 'vitest';
import { screen, within } from '@testing-library/react';
import TopicProgressList from './TopicProgressList';
import { jsonResponse, mockApi, problemResponse, renderWithProviders, signIn } from '../test/utils';
import type { TopicProgress } from '../types/api';

const topic = (code: string, nameEn: string, nameBn: string, overrides: Partial<TopicProgress> = {}): TopicProgress => ({
  topic: { code, nameEn, nameBn },
  questionsAnalysed: 0,
  practiceAnswered: 0,
  answersMarked: 0,
  answersCorrect: 0,
  accuracyPercentage: null,
  needsPractice: false,
  lastActivityAt: null,
  ...overrides
});

describe('TopicProgressList', () => {
  test('shows each started topic with accuracy and flags weak ones', async () => {
    signIn();
    mockApi({
      'GET /progress/topics': () => jsonResponse([
        topic('articles', 'Articles', 'আর্টিকেল', {
          questionsAnalysed: 1, practiceAnswered: 3, answersMarked: 4, answersCorrect: 1,
          accuracyPercentage: 25, needsPractice: true, lastActivityAt: '2026-10-16T08:00:00Z'
        }),
        topic('narration', 'Narration (Direct and Indirect Speech)', 'উক্তি পরিবর্তন', { questionsAnalysed: 1 }),
        topic('punctuation', 'Punctuation and Capitalization', 'বিরামচিহ্ন ও বড় হাতের অক্ষর')
      ])
    });

    renderWithProviders(<TopicProgressList />, { route: '/progress' });

    const articles = await screen.findByTestId('topic-articles');
    expect(within(articles).getByText('আর্টিকেল')).toHaveAttribute('lang', 'bn');
    expect(within(articles).getByText('Needs practice')).toBeInTheDocument();
    expect(within(articles).getByText('1 of 4 correct')).toBeInTheDocument();
    expect(within(articles).getByRole('progressbar', { name: 'Articles accuracy' })).toHaveAttribute('aria-valuenow', '25');

    const narration = screen.getByTestId('topic-narration');
    expect(within(narration).getByText(/No answers marked yet/)).toBeInTheDocument();
    expect(within(narration).queryByText('Needs practice')).not.toBeInTheDocument();

    expect(screen.queryByTestId('topic-punctuation')).not.toBeInTheDocument();
    expect(screen.getByText('Not started yet: Punctuation and Capitalization')).toBeInTheDocument();
  });

  test('suggests analysing a question when nothing is started', async () => {
    signIn();
    mockApi({ 'GET /progress/topics': () => jsonResponse([topic('articles', 'Articles', 'আর্টিকেল')]) });

    renderWithProviders(<TopicProgressList />, { route: '/progress' });

    expect(await screen.findByRole('link', { name: 'Analyze a question' })).toHaveAttribute('href', '/analyze');
  });

  test('shows the server message on failure', async () => {
    signIn();
    mockApi({ 'GET /progress/topics': () => problemResponse(500, 'Something went wrong on our side. Please try again later.') });

    renderWithProviders(<TopicProgressList />, { route: '/progress' });

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on our side. Please try again later.');
  });
});

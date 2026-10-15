import { describe, expect, test } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import PracticeSetPage from './PracticeSetPage';
import PracticeSetButton from '../components/PracticeSetButton';
import { jsonResponse, mockApi, problemResponse, renderWithProviders, signIn } from '../test/utils';
import type { Quiz, QuizQuestion } from '../types/api';

const unanswered = (id: number, sentence: string): QuizQuestion => ({
  id,
  question: 'Fill in the blank with a suitable article.',
  incorrectSentence: sentence,
  correctAnswer: null,
  userAnswer: null,
  isAnsweredCorrectly: null,
  explanation: null,
  answerType: 'text',
  explanationBn: null,
  feedbackEn: null,
  feedbackBn: null
});

const practiceSet = (questions: QuizQuestion[], score = 0): Quiz => ({
  id: 9,
  title: 'Practice: Articles',
  score,
  totalQuestions: questions.length,
  isCompleted: questions.every((q) => q.userAnswer),
  createdAt: '2026-10-16T08:00:00Z',
  completedAt: null,
  questions,
  topic: { code: 'articles', nameEn: 'Articles', nameBn: 'আর্টিকেল' },
  sourceAnalysisId: 5
});

const first = unanswered(91, 'He is ___ honour to his family.');
const second = unanswered(92, '___ sun rises in the east.');

const firstWrong: QuizQuestion = {
  ...first,
  userAnswer: 'a',
  correctAnswer: 'an',
  isAnsweredCorrectly: false,
  explanation: 'Honour starts with a vowel sound.',
  explanationBn: 'Honour স্বরধ্বনি দিয়ে শুরু।',
  feedbackEn: 'Not quite: the h is silent.',
  feedbackBn: 'পুরোপুরি ঠিক নয়: h উচ্চারিত হয় না।'
};

const secondRight: QuizQuestion = {
  ...second,
  userAnswer: 'The',
  correctAnswer: 'The',
  isAnsweredCorrectly: true,
  explanation: 'Unique things take the.',
  explanationBn: 'একক বস্তুর আগে the বসে।'
};

const renderPracticeSet = () =>
  renderWithProviders(
    <Routes>
      <Route path="/practice-sets/:id" element={<PracticeSetPage />} />
    </Routes>,
    { route: '/practice-sets/9' }
  );

describe('PracticeSetButton', () => {
  test('creates a practice set from the analysis and opens it', async () => {
    signIn();
    const fetchMock = mockApi({ 'POST /questions/5/practice-set': () => jsonResponse(practiceSet([first, second])) });
    renderWithProviders(<PracticeSetButton analysisId={5} />, { route: '/questions/5' });

    await userEvent.click(screen.getByRole('button', { name: 'Practice 3 similar questions' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/practice-sets/9'));
    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({ count: 3 });
  });

  test('shows the server message when the AI cannot create questions', async () => {
    signIn();
    mockApi({ 'POST /questions/5/practice-set': () => problemResponse(503, 'The AI returned an unexpected response. Please try again.') });
    renderWithProviders(<PracticeSetButton analysisId={5} />, { route: '/questions/5' });

    await userEvent.click(screen.getByRole('button', { name: 'Practice 3 similar questions' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The AI returned an unexpected response. Please try again.');
    expect(screen.getByRole('button', { name: 'Practice 3 similar questions' })).toBeEnabled();
  });
});

describe('PracticeSetPage', () => {
  test('answers each question, shows feedback in the chosen language and the final score', async () => {
    signIn();
    let state = practiceSet([first, second]);
    const answers: unknown[] = [];
    mockApi({
      'GET /quiz/9': () => jsonResponse(state),
      'POST /quiz/9/answer': (init) => {
        const body = JSON.parse(String(init?.body)) as { questionId: number; answer: string };
        answers.push(body);
        state = body.questionId === 91 ? practiceSet([firstWrong, second]) : practiceSet([firstWrong, secondRight], 1);
        return jsonResponse(state);
      }
    });
    renderPracticeSet();

    expect(await screen.findByText('He is ___ honour to his family.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Back to the original question' })).toHaveAttribute('href', '/questions/5');

    await userEvent.type(screen.getByLabelText('Your answer'), 'a');
    await userEvent.click(screen.getByRole('button', { name: 'Check Answer' }));

    expect(await screen.findByText('✗ Not quite')).toBeInTheDocument();
    expect(screen.getByText('Not quite: the h is silent.')).toBeInTheDocument();
    expect(screen.getByText('Honour starts with a vowel sound.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'বাংলা' }));
    expect(screen.getByText('পুরোপুরি ঠিক নয়: h উচ্চারিত হয় না।')).toBeInTheDocument();
    expect(screen.getByText('Honour স্বরধ্বনি দিয়ে শুরু।')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'English' }));

    await userEvent.click(screen.getByRole('button', { name: 'Next Question' }));
    expect(screen.getByLabelText('Your answer')).toHaveValue('');
    await userEvent.type(screen.getByLabelText('Your answer'), 'The');
    await userEvent.click(screen.getByRole('button', { name: 'Check Answer' }));
    expect(await screen.findByText('✓ Correct!')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'See Results' }));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(answers).toEqual([{ questionId: 91, answer: 'a' }, { questionId: 92, answer: 'The' }]);
  });

  test('keeps the question open when the AI cannot mark the answer', async () => {
    signIn();
    mockApi({
      'GET /quiz/9': () => jsonResponse(practiceSet([first])),
      'POST /quiz/9/answer': () => problemResponse(503, 'The AI service is currently unavailable. Please try again later.')
    });
    renderPracticeSet();

    await userEvent.type(await screen.findByLabelText('Your answer'), 'a');
    await userEvent.click(screen.getByRole('button', { name: 'Check Answer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The AI service is currently unavailable. Please try again later.');
    expect(screen.getByLabelText('Your answer')).toHaveValue('a');
    expect(screen.getByRole('button', { name: 'Check Answer' })).toBeEnabled();
  });

  test('resumes at the first unanswered question', async () => {
    signIn();
    mockApi({ 'GET /quiz/9': () => jsonResponse(practiceSet([firstWrong, second])) });

    renderPracticeSet();

    expect(await screen.findByText('___ sun rises in the east.')).toBeInTheDocument();
    expect(screen.getByText(/Question 2 of 2/)).toBeInTheDocument();
  });
});

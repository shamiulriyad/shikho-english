import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useLanguage, type Language } from '../../context/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';
import ProgressBar from '../ui/ProgressBar';
import { ApiErrorNotice } from '../ui/States';
import type { QuizQuestion } from '../../types/api';

const ARTICLE_OPTIONS = ['a', 'an', 'the'] as const;
const MAX_ANSWER_LENGTH = 500;

const LABELS = {
  en: { correct: '✓ Correct!', incorrect: '✗ Not quite', yourAnswer: 'Your answer:', correctAnswer: 'Correct answer:' },
  bn: { correct: '✓ সঠিক!', incorrect: '✗ সঠিক হয়নি', yourAnswer: 'তোমার উত্তর:', correctAnswer: 'সঠিক উত্তর:' }
} as const;

/** Marked answer. Bilingual questions follow the language toggle; the rest stay in English. */
const AnswerFeedback = ({ question, language }: { question: QuizQuestion; language: Language }) => {
  const ref = useRef<HTMLDivElement>(null);
  const labels = LABELS[language];
  const feedback = language === 'bn' ? question.feedbackBn : question.feedbackEn;
  const explanation = language === 'bn' ? question.explanationBn ?? question.explanation : question.explanation;
  const correct = Boolean(question.isAnsweredCorrectly);

  // The answer controls disappear once marked, so move focus here instead of losing it
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      lang={language}
      className={`space-y-2 rounded-md border-l-4 px-4 py-3 focus:outline-none ${correct ? 'border-success bg-success-soft' : 'border-danger bg-danger-soft'}`}
    >
      <p className={`font-semibold ${correct ? 'text-success' : 'text-danger'}`}>{correct ? labels.correct : labels.incorrect}</p>
      <p className="text-ink">
        <strong>{labels.yourAnswer}</strong> <span lang="en">{question.userAnswer}</span>
      </p>
      <p className="text-ink">
        <strong>{labels.correctAnswer}</strong> <span lang="en">{question.correctAnswer}</span>
      </p>
      {feedback && <p className="text-ink">{feedback}</p>}
      {explanation && <p className="text-ink">{explanation}</p>}
    </div>
  );
};

interface QuestionCardProps {
  question: QuizQuestion;
  index: number;
  total: number;
  score: number;
  /** Feedback switches with the explanation language (practice sets); otherwise English only */
  bilingual: boolean;
  isSubmitting: boolean;
  error: unknown;
  onAnswer: (answer: string) => void;
  onNext: () => void;
  /** Focus the question when it appears (after "Next"), not on first page load */
  focusOnMount?: boolean;
  headerAction?: ReactNode;
}

/** One question of a quiz or practice set: choose an article or type an answer, then see it marked. */
const QuestionCard = ({
  question,
  index,
  total,
  score,
  bilingual,
  isSubmitting,
  error,
  onAnswer,
  onNext,
  focusOnMount = false,
  headerAction
}: QuestionCardProps) => {
  const { language } = useLanguage();
  const [answer, setAnswer] = useState('');
  const promptRef = useRef<HTMLParagraphElement>(null);
  const isAnswered = Boolean(question.userAnswer);
  const isLast = index === total - 1;
  const answeredCount = isAnswered ? index + 1 : index;

  useEffect(() => {
    if (focusOnMount) promptRef.current?.focus();
  }, [focusOnMount]);

  const submitText = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (answer.trim()) onAnswer(answer);
  };

  return (
    <section aria-label={`Question ${index + 1}`} className="rounded-lg border border-line bg-white shadow-paper">
      <div className="space-y-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink-muted">
            Question {index + 1} of {total} · {score} correct
          </p>
          {headerAction}
        </div>
        <ProgressBar value={answeredCount} max={total} label="Questions answered" />
      </div>

      <div className="space-y-5 px-5 py-6 sm:px-6">
        <div>
          <p ref={promptRef} tabIndex={-1} className="font-semibold text-brand-forest focus:outline-none">
            {question.question}
          </p>
          <p className="mt-3 whitespace-pre-wrap rounded-md bg-paper px-4 py-3 text-lg text-ink" lang="en">
            {question.incorrectSentence}
          </p>
        </div>

        {error !== null && <ApiErrorNotice error={error} title="Your answer wasn’t marked" />}

        {isAnswered ? (
          <>
            <AnswerFeedback question={question} language={bilingual ? language : 'en'} />
            <Button size="lg" fullWidth onClick={onNext}>
              {isLast ? 'See Results' : 'Next Question'}
            </Button>
          </>
        ) : question.answerType === 'articles' ? (
          <div role="group" aria-label="Choose an article" className="grid grid-cols-3 gap-3">
            {ARTICLE_OPTIONS.map((option) => (
              <Button
                key={option}
                variant="secondary"
                size="lg"
                disabled={isSubmitting}
                onClick={() => onAnswer(option)}
                className="text-lg"
              >
                {option}
              </Button>
            ))}
          </div>
        ) : (
          <form onSubmit={submitText} className="space-y-3">
            <Input
              id="practice-answer"
              label="Your answer"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              maxLength={MAX_ANSWER_LENGTH}
              autoComplete="off"
            />
            <Button type="submit" size="lg" fullWidth disabled={!answer.trim()} loading={isSubmitting} loadingText="Checking…">
              Check Answer
            </Button>
          </form>
        )}
      </div>
    </section>
  );
};

export default QuestionCard;

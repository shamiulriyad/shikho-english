import type { ReactNode } from 'react';
import type { Quiz } from '../../types/api';

/** Final score plus a one-line review of every question. */
const PracticeResults = ({ quiz, heading, actions }: { quiz: Quiz; heading: string; actions: ReactNode }) => {
  const percentage = quiz.totalQuestions > 0 ? (quiz.score / quiz.totalQuestions) * 100 : 0;

  return (
    <section aria-labelledby="results-heading" className="rounded-lg border border-line bg-white shadow-paper">
      <div className="border-b border-line px-5 py-8 text-center sm:px-6">
        <h2 id="results-heading" className="text-h2 text-brand-forest">{heading}</h2>
        <p className="mt-4 text-display text-brand-forest">{quiz.score} / {quiz.totalQuestions}</p>
        <p className="mt-1 text-ink-muted">
          <span>{percentage.toFixed(1)}%</span> correct
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>
      </div>

      <ol className="divide-y divide-line">
        {quiz.questions.map((question, index) => (
          <li key={question.id} className="flex gap-3 px-5 py-4 sm:px-6">
            <span
              className={`mt-0.5 shrink-0 font-semibold ${question.isAnsweredCorrectly ? 'text-success' : 'text-danger'}`}
            >
              {question.isAnsweredCorrectly ? '✓' : '✗'}
              <span className="sr-only">{question.isAnsweredCorrectly ? ' Correct' : ' Not correct'}</span>
            </span>
            <div className="min-w-0">
              <p className="text-ink" lang="en">
                <span className="text-ink-muted">{index + 1}. </span>
                {question.incorrectSentence}
              </p>
              <p className="mt-1 text-sm text-ink-muted" lang="en">
                Your answer: <span className="font-semibold text-ink">{question.userAnswer ?? '—'}</span>
                {!question.isAnsweredCorrectly && question.correctAnswer && (
                  <> · Correct: <span className="font-semibold text-success">{question.correctAnswer}</span></>
                )}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default PracticeResults;

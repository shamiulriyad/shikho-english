import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';
import { formatDate } from '../utils/helpers';
import Badge from './ui/Badge';
import { ButtonLink } from './ui/Button';
import { ApiErrorNotice, EmptyState, LoadingState } from './ui/States';
import type { Quiz } from '../types/api';

const INITIAL_COUNT = 5;

const answeredCount = (quiz: Quiz) => quiz.questions.filter((q) => q.userAnswer).length;

/**
 * Past quizzes and practice sets from GET /quiz/user/all (newest first). Unfinished ones can be continued:
 * the practice page resumes at the first unanswered question, which the API supports.
 */
const RecentPracticeList = () => {
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!token) return;

    let active = true;
    setError(null);
    apiCall<Quiz[]>('/quiz/user/all')
      .then((data) => {
        if (active) setQuizzes(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err);
      });

    return () => {
      active = false;
    };
  }, [token, attempt]);

  const heading = (
    <h2 id="recent-practice-heading" className="mb-4 text-h2 text-brand-forest">
      Recent quizzes and practice sets
    </h2>
  );

  if (error !== null) {
    return (
      <section aria-labelledby="recent-practice-heading">
        {heading}
        <ApiErrorNotice error={error} title="We couldn’t load your quizzes" onRetry={() => setAttempt((n) => n + 1)} />
      </section>
    );
  }

  if (!quizzes) {
    return <LoadingState label="Loading quizzes and practice sets…" />;
  }

  const visible = showAll ? quizzes : quizzes.slice(0, INITIAL_COUNT);

  return (
    <section aria-labelledby="recent-practice-heading">
      {heading}

      {quizzes.length === 0 ? (
        <EmptyState
          title="No quizzes or practice sets yet"
          description="Take an article quiz, or analyse a question and practise similar ones."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink to="/quiz">Take a quiz</ButtonLink>
              <ButtonLink to="/analyze" variant="secondary">Analyze a question</ButtonLink>
            </div>
          }
        />
      ) : (
        <>
          <ul id="recent-practice-list" className="divide-y divide-line rounded-lg border border-line bg-white">
            {visible.map((quiz) => {
              const answered = answeredCount(quiz);
              const finished = quiz.isCompleted && answered === quiz.questions.length;
              return (
                <li key={quiz.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                      <Badge tone="brand">{quiz.topic ? `Practice set · ${quiz.topic.nameEn}` : 'Article quiz'}</Badge>
                      <span>{formatDate(quiz.createdAt)}</span>
                    </div>
                    <p className="font-semibold text-ink">{quiz.title}</p>
                    <p className="text-sm text-ink-muted">
                      {finished
                        ? `Score ${quiz.score} / ${quiz.totalQuestions}`
                        : `${answered} of ${quiz.questions.length} answered`}
                    </p>
                  </div>
                  <Link
                    to={`/practice-sets/${quiz.id}`}
                    className="shrink-0 rounded-md border border-brand-forest px-3 py-1.5 text-sm font-semibold text-brand-forest transition-colors hover:bg-info-soft"
                  >
                    {finished ? 'Review' : 'Continue'}
                    <span className="sr-only">: {quiz.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {quizzes.length > INITIAL_COUNT && (
            <button
              type="button"
              aria-expanded={showAll}
              aria-controls="recent-practice-list"
              onClick={() => setShowAll((value) => !value)}
              className="mt-3 font-semibold text-brand-forest underline-offset-4 hover:underline"
            >
              {showAll ? 'Show fewer' : `Show all ${quizzes.length}`}
            </button>
          )}
        </>
      )}
    </section>
  );
};

export default RecentPracticeList;

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';
import { formatDate, plural } from '../utils/helpers';
import Badge from './ui/Badge';
import ProgressBar from './ui/ProgressBar';
import { ApiErrorNotice, EmptyState, LoadingState } from './ui/States';
import { ButtonLink } from './ui/Button';
import type { TopicProgress } from '../types/api';

const accuracyTone = (accuracy: number) => (accuracy >= 80 ? 'success' : accuracy >= 60 ? 'warning' : 'danger');

const TopicProgressList = () => {
  const { token } = useAuth();
  const [topics, setTopics] = useState<TopicProgress[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return;

    let active = true;
    setError(null);
    apiCall<TopicProgress[]>('/progress/topics')
      .then((data) => {
        if (active) setTopics(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err);
      });

    return () => {
      active = false;
    };
  }, [token, attempt]);

  const heading = (
    <h2 id="topic-progress-heading" className="mb-4 text-h2 text-brand-forest">
      Progress by topic
    </h2>
  );

  if (error !== null) {
    return (
      <section aria-labelledby="topic-progress-heading">
        {heading}
        <ApiErrorNotice error={error} title="We couldn’t load your topic progress" onRetry={() => setAttempt((n) => n + 1)} />
      </section>
    );
  }

  if (!topics) {
    return <LoadingState label="Loading topic progress…" />;
  }

  const started = topics.filter((t) => t.questionsAnalysed > 0 || t.practiceAnswered > 0);
  const notStarted = topics.filter((t) => t.questionsAnalysed === 0 && t.practiceAnswered === 0);

  return (
    <section aria-labelledby="topic-progress-heading">
      {heading}

      {started.length === 0 && (
        <EmptyState
          title="No topics yet"
          description="Analyse a question and its topic will appear here."
          action={<ButtonLink to="/analyze">Analyze a question</ButtonLink>}
        />
      )}

      {started.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {started.map((item) => (
            <li key={item.topic.code} className="flex flex-col rounded-lg border border-line bg-white px-5 py-4" data-testid={`topic-${item.topic.code}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-brand-forest">{item.topic.nameEn}</p>
                  <p className="text-sm text-ink-muted" lang="bn">{item.topic.nameBn}</p>
                </div>
                {item.needsPractice && <Badge tone="danger">Needs practice</Badge>}
              </div>

              <p className="mt-2 text-sm text-ink-muted">
                {plural(item.questionsAnalysed, 'question')} analysed · {plural(item.practiceAnswered, 'practice answer')}
                {item.lastActivityAt && <> · last {formatDate(item.lastActivityAt)}</>}
              </p>

              {item.accuracyPercentage === null ? (
                <p className="mt-3 text-sm text-ink-muted">No answers marked yet. Add your answer when analysing, or try a practice set.</p>
              ) : (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-sm text-ink">
                    <span>{item.answersCorrect} of {item.answersMarked} correct</span>
                    <span className="font-semibold">{item.accuracyPercentage.toFixed(0)}%</span>
                  </div>
                  <ProgressBar
                    value={item.accuracyPercentage}
                    max={100}
                    label={`${item.topic.nameEn} accuracy`}
                    tone={accuracyTone(item.accuracyPercentage)}
                  />
                </div>
              )}

              <Link
                to={`/analyze?topic=${encodeURIComponent(item.topic.code)}`}
                className="mt-4 self-start text-sm font-semibold text-brand-forest underline-offset-4 hover:underline"
              >
                Practise this topic<span className="sr-only">: {item.topic.nameEn}</span>
                <span aria-hidden="true" className="ml-1">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {notStarted.length > 0 && (
        <p className="mt-4 text-sm text-ink-muted">
          Not started yet: {notStarted.map((t) => t.topic.nameEn).join(', ')}
        </p>
      )}
    </section>
  );
};

export default TopicProgressList;

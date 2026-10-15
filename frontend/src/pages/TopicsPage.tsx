import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';
import { plural } from '../utils/helpers';
import { loginPath } from '../utils/returnTo';
import Badge from '../components/ui/Badge';
import { PageContainer, PageHeader } from '../components/ui/Page';
import { ApiErrorNotice, LoadingState } from '../components/ui/States';
import type { Topic, TopicProgress } from '../types/api';

// The catch-all topic isn't something to pick; the intro explains it instead
const CATCH_ALL = 'other';

const ProgressSummary = ({ progress }: { progress: TopicProgress | undefined }) => {
  if (!progress || (progress.questionsAnalysed === 0 && progress.practiceAnswered === 0)) {
    return <p className="text-sm text-ink-muted">Not started yet</p>;
  }
  return (
    <p className="text-sm text-ink-muted">
      {plural(progress.questionsAnalysed, 'question')} analysed
      {progress.accuracyPercentage !== null && <> · {progress.accuracyPercentage.toFixed(0)}% correct</>}
    </p>
  );
};

/** Every grammar topic the backend knows, with the student's progress when signed in. Names only. */
const TopicsPage = () => {
  const { user, token } = useAuth();
  const signedIn = Boolean(user && token);
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [topicsError, setTopicsError] = useState<unknown>(null);
  const [progress, setProgress] = useState<TopicProgress[] | null>(null);
  const [progressError, setProgressError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const [progressAttempt, setProgressAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setTopicsError(null);
    apiCall<Topic[]>('/topics')
      .then((data) => {
        if (active) setTopics(data);
      })
      .catch((err: unknown) => {
        if (active) setTopicsError(err);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  // Progress is extra: if it fails, the topics are still useful on their own
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    setProgressError(null);
    apiCall<TopicProgress[]>('/progress/topics')
      .then((data) => {
        if (active) setProgress(data);
      })
      .catch((err: unknown) => {
        if (active) setProgressError(err);
      });
    return () => {
      active = false;
    };
  }, [signedIn, progressAttempt]);

  const listed = topics?.filter((topic) => topic.code !== CATCH_ALL) ?? [];
  const progressFor = (code: string) => progress?.find((item) => item.topic.code === code);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Topics"
        title="Grammar topics"
        description="The SSC English 2nd Paper grammar topics you can ask about. A question that fits none of them is filed under Other."
      />

      <div className="space-y-6">
        {topicsError !== null && (
          <ApiErrorNotice error={topicsError} title="We couldn’t load the topics" onRetry={() => setAttempt((n) => n + 1)} />
        )}
        {!topics && topicsError === null && <LoadingState label="Loading topics…" />}
        {progressError !== null && (
          <ApiErrorNotice
            error={progressError}
            title="We couldn’t load your progress"
            onRetry={() => setProgressAttempt((n) => n + 1)}
          />
        )}

        {listed.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listed.map((topic) => {
              const analyzeHere = `/analyze?topic=${encodeURIComponent(topic.code)}`;
              const item = progressFor(topic.code);
              return (
                <li key={topic.code} data-testid={`topic-${topic.code}`} className="flex flex-col rounded-lg border border-line bg-white px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-h3 text-brand-forest">{topic.nameEn}</h2>
                      <p className="text-ink-muted" lang="bn">{topic.nameBn}</p>
                    </div>
                    {item?.needsPractice && <Badge tone="danger">Needs practice</Badge>}
                  </div>
                  {signedIn && progress && (
                    <div className="mt-3">
                      <ProgressSummary progress={item} />
                    </div>
                  )}
                  <Link
                    to={signedIn ? analyzeHere : loginPath(analyzeHere)}
                    className="mt-4 self-start text-sm font-semibold text-brand-forest underline-offset-4 hover:underline"
                  >
                    {signedIn ? 'Analyze a question' : 'Log in to practise'}{' '}
                    <span className="sr-only">in {topic.nameEn}</span>
                    <span aria-hidden="true" className="ml-1">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageContainer>
  );
};

export default TopicsPage;

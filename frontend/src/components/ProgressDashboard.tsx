import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';
import StatTile from './ui/StatTile';
import { ApiErrorNotice, LoadingState } from './ui/States';
import type { UserProgress } from '../types/api';

/**
 * Totals from GET /practice/progress. The backend counts quizzes and practice sets together (both are
 * saved as quizzes), so the labels say so rather than calling it a quiz-only average.
 */
const ProgressDashboard = () => {
  const { token } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return;

    let active = true;
    setError(null);
    apiCall<UserProgress>('/practice/progress')
      .then((data) => {
        if (active) setProgress(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err);
      });

    return () => {
      active = false;
    };
  }, [token, attempt]);

  if (error !== null) {
    return <ApiErrorNotice error={error} title="We couldn’t load your totals" onRetry={() => setAttempt((n) => n + 1)} />;
  }

  if (!progress) {
    return <LoadingState label="Loading progress…" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Sentences checked" value={progress.totalPractices} caption="In Sentence Check" />
      <StatTile label="Correct as written" value={progress.correctPractices} caption="Sentences that needed no changes" />
      <StatTile
        label="Sentence accuracy"
        value={progress.totalPractices > 0 ? `${progress.correctPercentage.toFixed(1)}%` : '—'}
        caption={progress.totalPractices > 0 ? 'Share of sentences already correct' : 'Check a sentence to see this'}
      />
      <StatTile
        label="Average score"
        value={progress.totalQuizzes > 0 ? `${progress.averageQuizScore.toFixed(1)}%` : '—'}
        caption={
          progress.totalQuizzes > 0
            ? `Across ${progress.totalQuizzes} completed ${progress.totalQuizzes === 1 ? 'quiz or practice set' : 'quizzes and practice sets'}`
            : 'Finish a quiz or practice set to see this'
        }
      />
    </div>
  );
};

export default ProgressDashboard;

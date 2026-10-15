import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';
import { formatDate } from '../utils/helpers';
import type { TopicProgress } from '../types/api';

const accuracyColour = (accuracy: number) =>
  accuracy >= 80 ? 'bg-green-500' : accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500';

const TopicProgressList = () => {
  const { token } = useAuth();
  const [topics, setTopics] = useState<TopicProgress[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    let active = true;
    apiCall<TopicProgress[]>('/progress/topics')
      .then((data) => {
        if (active) setTopics(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (error) {
    return <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>;
  }

  if (!topics) {
    return <p className="text-center text-gray-600">Loading topic progress...</p>;
  }

  const started = topics.filter((t) => t.questionsAnalysed > 0 || t.practiceAnswered > 0);
  const notStarted = topics.filter((t) => t.questionsAnalysed === 0 && t.practiceAnswered === 0);

  return (
    <section aria-labelledby="topic-progress-heading" className="bg-white rounded-lg shadow-lg p-6">
      <h2 id="topic-progress-heading" className="text-2xl font-bold text-gray-800 mb-4">Progress by topic</h2>

      {started.length === 0 && (
        <p className="text-gray-600 mb-4">
          No topics yet. <Link to="/analyze" className="text-blue-600 font-semibold hover:underline">Analyze a question</Link> to get started.
        </p>
      )}

      <ul className="space-y-4">
        {started.map((item) => (
          <li key={item.topic.code} className="border border-gray-200 rounded-lg p-4" data-testid={`topic-${item.topic.code}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800">{item.topic.nameEn}</p>
                <p className="text-sm text-gray-500" lang="bn">{item.topic.nameBn}</p>
              </div>
              {item.needsPractice && (
                <span className="bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">Needs practice</span>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-2">
              {item.questionsAnalysed} question{item.questionsAnalysed === 1 ? '' : 's'} analysed · {item.practiceAnswered} practice answer{item.practiceAnswered === 1 ? '' : 's'}
              {item.lastActivityAt && <> · last {formatDate(item.lastActivityAt)}</>}
            </p>

            {item.accuracyPercentage === null ? (
              <p className="text-sm text-gray-500 mt-2">No answers marked yet. Add your answer when analysing, or try a practice set.</p>
            ) : (
              <div className="mt-2">
                <div className="flex justify-between text-sm text-gray-700 mb-1">
                  <span>{item.answersCorrect} of {item.answersMarked} correct</span>
                  <span className="font-semibold">{item.accuracyPercentage.toFixed(0)}%</span>
                </div>
                <div
                  className="w-full bg-gray-200 rounded-full h-2"
                  role="progressbar"
                  aria-label={`${item.topic.nameEn} accuracy`}
                  aria-valuenow={item.accuracyPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className={`h-2 rounded-full ${accuracyColour(item.accuracyPercentage)}`} style={{ width: `${item.accuracyPercentage}%` }} />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {notStarted.length > 0 && (
        <p className="text-sm text-gray-500 mt-4">
          Not started yet: {notStarted.map((t) => t.topic.nameEn).join(', ')}
        </p>
      )}
    </section>
  );
};

export default TopicProgressList;

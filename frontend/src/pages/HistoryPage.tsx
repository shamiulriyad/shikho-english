import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTopics } from '../hooks/useTopics';
import { apiCall } from '../utils/api';
import { formatDate } from '../utils/helpers';
import type { PagedResult, QuestionAnalysisSummary } from '../types/api';

const PAGE_SIZE = 10;

const HistoryPage = () => {
  const { token } = useRequireAuth();
  const topics = useTopics();
  const [topic, setTopic] = useState('');
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<PagedResult<QuestionAnalysisSummary> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    let active = true;
    const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (topic) query.set('topic', topic);

    apiCall<PagedResult<QuestionAnalysisSummary>>(`/questions/history?${query}`)
      .then((data) => {
        if (active) {
          setHistory(data);
          setError('');
        }
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      active = false;
    };
  }, [token, page, topic]);

  const totalPages = history ? Math.max(1, Math.ceil(history.totalCount / PAGE_SIZE)) : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Question History</h1>
          <div>
            <label htmlFor="history-topic" className="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <select
              id="history-topic"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All topics</option>
              {topics.map((t) => (
                <option key={t.code} value={t.code}>{t.nameEn}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        )}

        {!history && !error && <p className="text-gray-600">Loading history...</p>}

        {history && history.items.length === 0 && (
          <p className="text-gray-600">
            No questions yet. <Link to="/analyze" className="text-blue-600 font-semibold hover:underline">Analyze your first question</Link>.
          </p>
        )}

        {history && history.items.length > 0 && (
          <>
            <ul className="divide-y divide-gray-200">
              {history.items.map((item) => (
                <li key={item.id}>
                  <Link to={`/questions/${item.id}`} className="block py-4 hover:bg-blue-50 rounded px-2 transition">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-1">
                      <span>{formatDate(item.createdAt)}</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{item.topic.nameEn}</span>
                      {item.studentAnswerIsCorrect === true && <span className="text-green-700 font-semibold">✓ You were right</span>}
                      {item.studentAnswerIsCorrect === false && <span className="text-red-700 font-semibold">✗ Needs review</span>}
                    </div>
                    <p className="text-gray-800 line-clamp-2">{item.questionText}</p>
                    <p className="text-sm text-green-700 mt-1">Answer: {item.correctAnswer}</p>
                  </Link>
                </li>
              ))}
            </ul>

            <nav aria-label="History pages" className="flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;

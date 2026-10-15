import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { apiCall } from '../utils/api';
import AnalysisResult from '../components/AnalysisResult';
import PracticeSetButton from '../components/PracticeSetButton';
import type { QuestionAnalysis } from '../types/api';

const QuestionDetailPage = () => {
  const { token } = useRequireAuth();
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<QuestionAnalysis | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !id) return;

    let active = true;
    apiCall<QuestionAnalysis>(`/questions/${encodeURIComponent(id)}`)
      .then((data) => {
        if (active) setAnalysis(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      active = false;
    };
  }, [token, id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link to="/history" className="inline-block text-blue-700 font-semibold hover:underline">← Back to history</Link>

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        )}
        {!analysis && !error && <p className="text-gray-600">Loading...</p>}
        {analysis && <AnalysisResult analysis={analysis} />}
        {analysis && <PracticeSetButton analysisId={analysis.id} />}
      </div>
    </div>
  );
};

export default QuestionDetailPage;

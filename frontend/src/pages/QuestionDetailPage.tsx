import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { ApiError, apiCall } from '../utils/api';
import { formatDate } from '../utils/helpers';
import AnalysisResult from '../components/AnalysisResult';
import PracticeSetButton from '../components/PracticeSetButton';
import { ButtonLink } from '../components/ui/Button';
import { PageContainer, PageHeader } from '../components/ui/Page';
import { ApiErrorNotice, LoadingState } from '../components/ui/States';
import type { QuestionAnalysis } from '../types/api';

const QuestionDetailPage = () => {
  const { token } = useRequireAuth();
  const { id } = useParams();
  const [analysis, setAnalysis] = useState<QuestionAnalysis | null>(null);
  const [error, setError] = useState<unknown>(null);
  // Bumped by "Try again" to fetch once more
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token || !id) return;

    let active = true;
    setError(null);
    apiCall<QuestionAnalysis>(`/questions/${encodeURIComponent(id)}`)
      .then((data) => {
        if (active) setAnalysis(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err);
      });

    return () => {
      active = false;
    };
  }, [token, id, attempt]);

  // A missing (or someone else's) question won't appear by retrying
  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <PageContainer width="reading">
      <Link to="/history" className="mb-6 inline-block font-semibold text-brand-forest underline-offset-4 hover:underline">
        ← Back to history
      </Link>

      <PageHeader
        eyebrow="Saved question"
        documentTitle={analysis ? `Saved question: ${analysis.topic.nameEn}` : 'Saved question'}
        title={analysis ? analysis.topic.nameEn : 'Question'}
        description={analysis ? `Analysed on ${formatDate(analysis.createdAt)}` : undefined}
      />

      <div className="space-y-6">
        {error !== null && (
          <>
            <ApiErrorNotice
              error={error}
              title={notFound ? 'We couldn’t find this question' : 'We couldn’t load this question'}
              onRetry={notFound ? undefined : () => setAttempt((n) => n + 1)}
            />
            {notFound && <ButtonLink to="/analyze" variant="secondary">Analyze a new question</ButtonLink>}
          </>
        )}
        {!analysis && error === null && <LoadingState label="Loading question…" />}
        {analysis && <AnalysisResult analysis={analysis} />}
        {analysis && <PracticeSetButton analysisId={analysis.id} />}
      </div>
    </PageContainer>
  );
};

export default QuestionDetailPage;

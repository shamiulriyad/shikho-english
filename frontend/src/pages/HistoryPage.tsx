import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTopics } from '../hooks/useTopics';
import { apiCall } from '../utils/api';
import { formatDate } from '../utils/helpers';
import Badge from '../components/ui/Badge';
import { Button, ButtonLink } from '../components/ui/Button';
import { Select } from '../components/ui/Field';
import { PageContainer, PageHeader } from '../components/ui/Page';
import { ApiErrorNotice, EmptyState, LoadingState } from '../components/ui/States';
import type { PagedResult, QuestionAnalysisSummary } from '../types/api';

const PAGE_SIZE = 10;

// Page and topic live in the address, so Back, refresh and shared links keep the student's place
const readPage = (raw: string | null) => {
  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
};

const HistoryPage = () => {
  const { token } = useRequireAuth();
  const topics = useTopics();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = readPage(searchParams.get('page'));
  const topic = searchParams.get('topic') ?? '';
  const [history, setHistory] = useState<PagedResult<QuestionAnalysisSummary> | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return;

    let active = true;
    setError(null);
    const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (topic) query.set('topic', topic);

    apiCall<PagedResult<QuestionAnalysisSummary>>(`/questions/history?${query}`)
      .then((data) => {
        if (active) setHistory(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err);
      });

    return () => {
      active = false;
    };
  }, [token, page, topic, attempt]);

  const navigate = (next: { page?: number; topic?: string }) => {
    const params = new URLSearchParams();
    const nextTopic = next.topic ?? topic;
    const nextPage = next.page ?? page;
    if (nextTopic) params.set('topic', nextTopic);
    if (nextPage > 1) params.set('page', String(nextPage));
    setSearchParams(params);
  };

  const totalPages = history ? Math.max(1, Math.ceil(history.totalCount / PAGE_SIZE)) : 1;
  const topicName = topics.find((t) => t.code === topic)?.nameEn;

  return (
    <PageContainer width="reading">
      <PageHeader
        eyebrow="History"
        title="Question History"
        description="Every question you have analysed. Open one to read the explanation again or practise it."
        actions={<ButtonLink to="/analyze" variant="secondary">Analyze a question</ButtonLink>}
      />

      <div className="mb-6 max-w-xs">
        <Select id="history-topic" label="Topic" value={topic} onChange={(e) => navigate({ topic: e.target.value, page: 1 })}>
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.code} value={t.code}>{t.nameEn}</option>
          ))}
        </Select>
      </div>

      {error !== null && (
        <ApiErrorNotice error={error} title="We couldn’t load your history" onRetry={() => setAttempt((n) => n + 1)} />
      )}

      {!history && error === null && <LoadingState label="Loading history…" />}

      {history && error === null && history.items.length === 0 && (
        page > 1 ? (
          <EmptyState
            title="Nothing on this page"
            description="This page is past the end of your history."
            action={<Button variant="secondary" onClick={() => navigate({ page: 1 })}>Go to the first page</Button>}
          />
        ) : topic ? (
          <EmptyState
            title={`No questions in ${topicName ?? 'this topic'} yet`}
            action={<Button variant="secondary" onClick={() => navigate({ topic: '', page: 1 })}>Show all topics</Button>}
          />
        ) : (
          <EmptyState
            title="No questions yet"
            description={
              <>
                <Link to="/analyze" className="font-semibold text-brand-forest underline underline-offset-4">
                  Analyze your first question
                </Link>
                .
              </>
            }
          />
        )
      )}

      {history && error === null && history.items.length > 0 && (
        <>
          <ul className="divide-y divide-line rounded-lg border border-line bg-white">
            {history.items.map((item) => (
              <li key={item.id}>
                <Link to={`/questions/${item.id}`} className="block px-5 py-4 transition-colors hover:bg-paper sm:px-6">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                    <span>{formatDate(item.createdAt)}</span>
                    <Badge tone="brand">{item.topic.nameEn}</Badge>
                    {item.studentAnswerIsCorrect === true && <Badge tone="success">✓ You were right</Badge>}
                    {item.studentAnswerIsCorrect === false && <Badge tone="danger">✗ Needs review</Badge>}
                  </div>
                  <p className="line-clamp-2 text-ink" lang="en">{item.questionText}</p>
                  <p className="mt-1 text-sm text-ink-muted" lang="en">
                    Answer: <span className="font-semibold text-success">{item.correctAnswer}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <nav aria-label="History pages" className="mt-6 flex items-center justify-between gap-4">
            <Button variant="secondary" onClick={() => navigate({ page: page - 1 })} disabled={page <= 1}>
              Previous
            </Button>
            <span className="text-sm text-ink-muted">Page {page} of {totalPages}</span>
            <Button variant="secondary" onClick={() => navigate({ page: page + 1 })} disabled={page >= totalPages}>
              Next
            </Button>
          </nav>
        </>
      )}
    </PageContainer>
  );
};

export default HistoryPage;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { Button } from './ui/Button';
import { AiProcessing, ApiErrorNotice } from './ui/States';
import type { Quiz } from '../types/api';

const QUESTION_COUNT = 3;

/** Creates practice questions like an analysed question and opens them. */
const PracticeSetButton = ({ analysisId }: { analysisId: number }) => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const createPracticeSet = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const quiz = await apiCall<Quiz>(`/questions/${analysisId}/practice-set`, {
        method: 'POST',
        body: JSON.stringify({ count: QUESTION_COUNT })
      });
      navigate(`/practice-sets/${quiz.id}`);
    } catch (err) {
      setError(err);
      setIsCreating(false);
    }
  };

  return (
    <section aria-labelledby="practice-set-heading" className="rounded-lg border border-line bg-white px-5 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-reading">
          <h2 id="practice-set-heading" className="text-h3 text-brand-forest">Try it yourself</h2>
          <p className="mt-1 text-ink-muted">
            Get {QUESTION_COUNT} new questions like this one and check your answers.
          </p>
        </div>
        <Button variant="accent" onClick={createPracticeSet} loading={isCreating}>
          Practice {QUESTION_COUNT} similar questions
        </Button>
      </div>

      {(isCreating || error !== null) && (
        <div className="mt-4">
          {isCreating && <AiProcessing label="Writing practice questions…" />}
          {error !== null && (
            <ApiErrorNotice error={error} title="We couldn’t create practice questions" onRetry={createPracticeSet} />
          )}
        </div>
      )}
    </section>
  );
};

export default PracticeSetButton;

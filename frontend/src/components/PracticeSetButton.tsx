import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import type { Quiz } from '../types/api';

const QUESTION_COUNT = 3;

/** Creates practice questions like an analysed question and opens them. */
const PracticeSetButton = ({ analysisId }: { analysisId: number }) => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const createPracticeSet = async () => {
    setIsCreating(true);
    setError('');
    try {
      const quiz = await apiCall<Quiz>(`/questions/${analysisId}/practice-set`, {
        method: 'POST',
        body: JSON.stringify({ count: QUESTION_COUNT })
      });
      navigate(`/practice-sets/${quiz.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 text-center space-y-3">
      <p className="text-gray-700">Ready to try it yourself?</p>
      <button
        type="button"
        onClick={createPracticeSet}
        disabled={isCreating}
        className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
      >
        {isCreating ? 'Creating practice questions...' : `Practice ${QUESTION_COUNT} similar questions`}
      </button>
      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}
    </div>
  );
};

export default PracticeSetButton;

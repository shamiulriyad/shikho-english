import { useEffect } from 'react';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { usePractice } from '../context/PracticeContext';
import PracticeSentenceInput from '../components/PracticeSentenceInput';
import PracticeHistory from '../components/PracticeHistory';

const PracticePage = () => {
  const { token } = useRequireAuth();
  const { practices, getHistory } = usePractice();

  useEffect(() => {
    if (token) {
      getHistory().catch((error) => console.error('Failed to load history:', error));
    }
  }, [token, getHistory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <PracticeSentenceInput />
        {practices.length > 0 && (
          <div className="mt-8">
            <PracticeHistory practices={practices} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticePage;

import { formatDate } from '../utils/helpers';
import type { PracticeResult } from '../types/api';

const PracticeHistory = ({ practices }: { practices: PracticeResult[] }) => {
  if (practices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No practice sessions yet. Start by submitting a sentence!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Practice History</h2>
      <div className="space-y-4">
        {practices.map((practice) => (
          <div key={practice.id} className={`p-4 rounded-lg border-l-4 ${practice.isCorrect ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'}`}>
            <p className="text-sm text-gray-600">
              {formatDate(practice.createdAt)}
              {practice.isCorrect && <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>}
              {!practice.isCorrect && <span className="ml-2 text-yellow-600 font-semibold">→ Corrected</span>}
            </p>
            <p className="font-semibold text-gray-800 my-1">Original: {practice.originalSentence}</p>
            {!practice.isCorrect && (
              <p className="font-semibold text-gray-800 mb-2">Corrected: <span className="text-green-700">{practice.correctedSentence}</span></p>
            )}
            <p className="text-sm text-gray-600">{practice.mistakes.length} mistake(s)</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PracticeHistory;

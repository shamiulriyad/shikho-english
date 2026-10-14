import React, { useState } from 'react';
import { usePractice } from '../context/PracticeContext';

const PracticeSentenceInput = () => {
  const [sentence, setSentence] = useState('');
  const { submitSentence, isLoading } = usePractice();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!sentence.trim()) return;
    setError('');
    try {
      setResult(await submitSentence(sentence));
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Practice Grammar</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter a sentence to check grammar (focus on articles: a, an, the)
        </label>
        <textarea
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="e.g., She is a good student."
          rows="3"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !sentence.trim()}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
      >
        {isLoading ? 'Checking...' : 'Check Grammar'}
      </button>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 border-t pt-6">
          <div className={`p-4 rounded-lg mb-4 ${result.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <p className="text-sm text-gray-600 mb-2">Original:</p>
            <p className="text-lg font-semibold text-gray-800 mb-4">{result.originalSentence}</p>

            {!result.isCorrect && (
              <>
                <p className="text-sm text-gray-600 mb-2">Corrected:</p>
                <p className="text-lg font-semibold text-green-700 mb-4">{result.correctedSentence}</p>

                {result.mistakes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Mistakes found:</p>
                    <div className="space-y-2">
                      {result.mistakes.map((mistake, idx) => (
                        <div key={idx} className="bg-white p-3 rounded border-l-4 border-red-400">
                          <p className="text-sm"><span className="font-semibold">Type:</span> {mistake.type}</p>
                          <p className="text-sm"><span className="font-semibold">Wrong:</span> <span className="text-red-600">{mistake.original}</span></p>
                          <p className="text-sm"><span className="font-semibold">Correct:</span> <span className="text-green-600">{mistake.correction}</span></p>
                          <p className="text-sm text-gray-600"><span className="font-semibold">Reason:</span> {mistake.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="bg-white p-3 rounded mt-2">
              <p className="text-sm"><span className="font-semibold">Explanation:</span></p>
              <p className="text-gray-700 mt-1">{result.explanation}</p>
            </div>

            {result.isCorrect && (
              <p className="text-green-700 font-semibold mt-4">✓ Perfect! Your sentence is grammatically correct.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeSentenceInput;

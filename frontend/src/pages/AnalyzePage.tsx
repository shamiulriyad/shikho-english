import { useState, type FormEvent } from 'react';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTopics } from '../hooks/useTopics';
import { apiCall } from '../utils/api';
import AnalysisResult from '../components/AnalysisResult';
import PracticeSetButton from '../components/PracticeSetButton';
import type { QuestionAnalysis } from '../types/api';

const MAX_QUESTION_LENGTH = 2000;
const MAX_ANSWER_LENGTH = 500;

const AnalyzePage = () => {
  useRequireAuth();
  const topics = useTopics();
  const [questionText, setQuestionText] = useState('');
  const [topicCode, setTopicCode] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [analysis, setAnalysis] = useState<QuestionAnalysis | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (questionText.trim().length < 3) return;

    setError('');
    setIsLoading(true);
    try {
      setAnalysis(await apiCall<QuestionAnalysis>('/questions/analyze', {
        method: 'POST',
        body: JSON.stringify({
          questionText,
          topicCode: topicCode || null,
          studentAnswer: studentAnswer.trim() || null
        })
      }));
    } catch (err) {
      setAnalysis(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analyze a Question</h1>
            <p className="text-gray-600 mt-1">
              Paste an SSC English 2nd Paper grammar question. You'll get the answer, step-by-step reasoning and the rule in English and বাংলা.
            </p>
          </div>

          <div>
            <label htmlFor="analyze-question" className="block text-sm font-medium text-gray-700 mb-1">
              Question
            </label>
            <textarea
              id="analyze-question"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              maxLength={MAX_QUESTION_LENGTH}
              rows={5}
              required
              placeholder="e.g., Fill in the blank with a suitable article: She is ___ honest girl."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 text-right">{questionText.length}/{MAX_QUESTION_LENGTH}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="analyze-topic" className="block text-sm font-medium text-gray-700 mb-1">
                Topic (optional)
              </label>
              <select
                id="analyze-topic"
                value={topicCode}
                onChange={(e) => setTopicCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Detect automatically</option>
                {topics.map((topic) => (
                  <option key={topic.code} value={topic.code}>
                    {topic.nameEn} ({topic.nameBn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="analyze-answer" className="block text-sm font-medium text-gray-700 mb-1">
                Your answer (optional)
              </label>
              <input
                id="analyze-answer"
                type="text"
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                maxLength={MAX_ANSWER_LENGTH}
                placeholder="We'll check it for you"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || questionText.trim().length < 3}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Analyzing... this can take a few seconds' : 'Analyze'}
          </button>

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </form>

        {analysis && <AnalysisResult analysis={analysis} />}
        {analysis && <PracticeSetButton analysisId={analysis.id} />}
      </div>
    </div>
  );
};

export default AnalyzePage;

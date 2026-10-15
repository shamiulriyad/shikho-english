import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useLanguage } from '../context/LanguageContext';
import { apiCall } from '../utils/api';
import LanguageToggle from '../components/LanguageToggle';
import type { Quiz, QuizQuestion } from '../types/api';

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

// Start on the first unanswered question so a reloaded page resumes where the student stopped
const firstUnanswered = (quiz: Quiz) => {
  const index = quiz.questions.findIndex((q) => !q.userAnswer);
  return index === -1 ? quiz.questions.length - 1 : index;
};

const AnswerResult = ({ question }: { question: QuizQuestion }) => {
  const { language } = useLanguage();
  const feedback = language === 'bn' ? question.feedbackBn : question.feedbackEn;
  const explanation = language === 'bn' ? question.explanationBn ?? question.explanation : question.explanation;

  return (
    <div
      lang={language}
      className={`p-4 rounded-lg border space-y-2 ${question.isAnsweredCorrectly ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
    >
      <p className={`font-semibold ${question.isAnsweredCorrectly ? 'text-green-700' : 'text-red-700'}`}>
        {question.isAnsweredCorrectly ? (language === 'bn' ? '✓ সঠিক!' : '✓ Correct!') : (language === 'bn' ? '✗ সঠিক হয়নি' : '✗ Not quite')}
      </p>
      <p className="text-gray-700">
        <strong>{language === 'bn' ? 'তোমার উত্তর:' : 'Your answer:'}</strong> <span lang="en">{question.userAnswer}</span>
      </p>
      <p className="text-gray-700">
        <strong>{language === 'bn' ? 'সঠিক উত্তর:' : 'Correct answer:'}</strong> <span lang="en">{question.correctAnswer}</span>
      </p>
      {feedback && <p className="text-gray-700">{feedback}</p>}
      {explanation && <p className="text-gray-700">{explanation}</p>}
    </div>
  );
};

const PracticeSetPage = () => {
  const { token } = useRequireAuth();
  const { id } = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !id) return;

    let active = true;
    apiCall<Quiz>(`/quiz/${encodeURIComponent(id)}`)
      .then((data) => {
        if (!active) return;
        setQuiz(data);
        setCurrentIndex(firstUnanswered(data));
        setShowResults(data.isCompleted && data.questions.every((q) => q.userAnswer));
      })
      .catch((err: unknown) => {
        if (active) setError(errorMessage(err));
      });

    return () => {
      active = false;
    };
  }, [token, id]);

  const question = quiz?.questions[currentIndex];

  const submitAnswer = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!quiz || !question || !answer.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      setQuiz(await apiCall<Quiz>(`/quiz/${quiz.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ questionId: question.id, answer })
      }));
    } catch (err) {
      // Nothing was recorded, so the student can simply try again
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNext = () => {
    if (!quiz) return;
    setAnswer('');
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const backLink = quiz?.sourceAnalysisId && (
    <Link to={`/questions/${quiz.sourceAnalysisId}`} className="inline-block text-blue-700 font-semibold hover:underline">
      ← Back to the original question
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {backLink}

        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        )}
        {!quiz && !error && <p className="text-gray-600">Loading...</p>}

        {quiz && showResults && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-800">Practice complete!</h1>
            <p className="text-5xl font-bold text-purple-600">{quiz.score} / {quiz.totalQuestions}</p>
            <Link to="/analyze" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
              Analyze another question
            </Link>
          </div>
        )}

        {quiz && question && !showResults && (
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-800">{quiz.title}</h1>
                <p className="text-gray-600">Question {currentIndex + 1} of {quiz.questions.length} · {quiz.score} correct</p>
              </div>
              <LanguageToggle />
            </div>

            <div>
              <p className="font-semibold text-gray-800">{question.question}</p>
              <p className="text-gray-700 mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">{question.incorrectSentence}</p>
            </div>

            {question.userAnswer ? (
              <>
                <AnswerResult question={question} />
                <button
                  type="button"
                  onClick={goToNext}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  {currentIndex === quiz.questions.length - 1 ? 'See Results' : 'Next Question'}
                </button>
              </>
            ) : (
              <form onSubmit={submitAnswer} className="space-y-3">
                <label htmlFor="practice-answer" className="block text-sm font-medium text-gray-700">
                  Your answer
                </label>
                <input
                  id="practice-answer"
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  maxLength={500}
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !answer.trim()}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Checking...' : 'Check Answer'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeSetPage;

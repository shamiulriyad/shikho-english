import { useState } from 'react';
import { apiCall } from '../utils/api';
import type { Quiz } from '../types/api';

const ARTICLE_OPTIONS = ['a', 'an', 'the'] as const;

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

const QuizComponent = () => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const createQuiz = async () => {
    setIsCreating(true);
    setError('');
    try {
      const data = await apiCall<Quiz>('/quiz/create', { method: 'POST' });
      setQuiz(data);
      setCurrentIndex(0);
      setShowResults(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  const submitAnswer = async (answer: string) => {
    const question = quiz?.questions[currentIndex];
    if (!quiz || !question) return;

    setIsLoading(true);
    setError('');
    try {
      const data = await apiCall<Quiz>(`/quiz/${quiz.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ questionId: question.id, answer })
      });
      setQuiz(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const goToNext = () => {
    if (!quiz) return;
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const errorBanner = error && (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  );

  if (!quiz) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Grammar Quiz</h2>
        <p className="text-gray-600 mb-6">Test your knowledge on English articles!</p>
        {errorBanner}
        <button
          onClick={createQuiz}
          disabled={isCreating}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isCreating ? 'Creating quiz...' : 'Start Quiz'}
        </button>
      </div>
    );
  }

  if (showResults) {
    const percentage = ((quiz.score / quiz.totalQuestions) * 100).toFixed(1);
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz Completed!</h2>
        <div className="text-center">
          <p className="text-5xl font-bold text-blue-600 mb-4">{percentage}%</p>
          <p className="text-xl text-gray-700 mb-6">
            You got <span className="font-bold text-green-600">{quiz.score}</span> out of{' '}
            <span className="font-bold">{quiz.totalQuestions}</span> correct!
          </p>
          <button
            onClick={() => setQuiz(null)}
            className="bg-blue-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            Start Another Quiz
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  if (!currentQuestion) {
    return null;
  }
  const isAnswered = Boolean(currentQuestion.userAnswer);
  const isLastQuestion = currentIndex === quiz.questions.length - 1;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-600">Question {currentIndex + 1} of {quiz.totalQuestions}</p>
          <p className="text-blue-600 font-semibold">{quiz.score} correct</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / quiz.totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {errorBanner}

      <h3 className="text-lg font-semibold text-gray-800 mb-4">{currentQuestion.question}</h3>
      <p className="text-gray-700 mb-6 p-4 bg-gray-50 rounded-lg">{currentQuestion.incorrectSentence}</p>

      <div className="space-y-3 mb-6">
        {ARTICLE_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => submitAnswer(option)}
            disabled={isLoading || isAnswered}
            className={`w-full p-3 text-left border-2 rounded-lg transition disabled:opacity-50 ${
              currentQuestion.userAnswer === option ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            }`}
          >
            <strong>{option}</strong>
          </button>
        ))}
      </div>

      {isAnswered && (
        <>
          <div className={`p-4 rounded-lg ${currentQuestion.isAnsweredCorrectly ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-semibold ${currentQuestion.isAnsweredCorrectly ? 'text-green-700' : 'text-red-700'}`}>
              {currentQuestion.isAnsweredCorrectly ? '✓ Correct!' : '✗ Incorrect'}
            </p>
            <p className="text-gray-700 mt-2"><strong>Correct answer:</strong> {currentQuestion.correctAnswer}</p>
            <p className="text-gray-700 mt-2"><strong>Explanation:</strong> {currentQuestion.explanation}</p>
          </div>
          <button
            onClick={goToNext}
            className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {isLastQuestion ? 'See Results' : 'Next Question'}
          </button>
        </>
      )}
    </div>
  );
};

export default QuizComponent;

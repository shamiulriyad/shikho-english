import { useState } from 'react';
import { apiCall } from '../utils/api';
import PracticeResults from './practice/PracticeResults';
import QuestionCard from './practice/QuestionCard';
import { Button } from './ui/Button';
import { AiProcessing, ApiErrorNotice } from './ui/States';
import type { Quiz } from '../types/api';

const QuizComponent = () => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<unknown>(null);
  const [answerError, setAnswerError] = useState<unknown>(null);
  const [movedOn, setMovedOn] = useState(false);

  const createQuiz = async () => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const data = await apiCall<Quiz>('/quiz/create', { method: 'POST' });
      setQuiz(data);
      setCurrentIndex(0);
      setShowResults(false);
      setMovedOn(false);
    } catch (err) {
      setCreateError(err);
    } finally {
      setIsCreating(false);
    }
  };

  const submitAnswer = async (answer: string) => {
    const question = quiz?.questions[currentIndex];
    if (!quiz || !question) return;

    setIsSubmitting(true);
    setAnswerError(null);
    try {
      setQuiz(await apiCall<Quiz>(`/quiz/${quiz.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ questionId: question.id, answer })
      }));
    } catch (err) {
      setAnswerError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNext = () => {
    if (!quiz) return;
    setMovedOn(true);
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  if (!quiz) {
    return (
      <section aria-labelledby="quiz-start-heading" className="space-y-5 rounded-lg border border-line bg-white px-5 py-8 shadow-paper sm:px-6">
        <div>
          <h2 id="quiz-start-heading" className="text-h3 text-brand-forest">Ready when you are</h2>
          <p className="mt-1 text-ink-muted">
            Choose a, an or the for each sentence. The correct answer is explained after every question.
          </p>
        </div>
        <Button variant="accent" size="lg" onClick={createQuiz} loading={isCreating}>
          Start Quiz
        </Button>
        {isCreating && <AiProcessing label="Writing your quiz questions…" />}
        {createError !== null && !isCreating && (
          <ApiErrorNotice error={createError} title="We couldn’t create a quiz" onRetry={createQuiz} />
        )}
      </section>
    );
  }

  if (showResults) {
    return (
      <PracticeResults
        quiz={quiz}
        heading="Quiz Completed!"
        actions={<Button onClick={() => setQuiz(null)}>Start Another Quiz</Button>}
      />
    );
  }

  const question = quiz.questions[currentIndex];
  if (!question) return null;

  return (
    <QuestionCard
      key={question.id}
      question={question}
      index={currentIndex}
      total={quiz.questions.length}
      score={quiz.score}
      bilingual={false}
      isSubmitting={isSubmitting}
      error={answerError}
      onAnswer={(answer) => void submitAnswer(answer)}
      onNext={goToNext}
      focusOnMount={movedOn}
    />
  );
};

export default QuizComponent;

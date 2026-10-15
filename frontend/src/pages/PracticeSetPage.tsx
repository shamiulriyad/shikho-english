import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { ApiError, apiCall } from '../utils/api';
import LanguageToggle from '../components/LanguageToggle';
import PracticeResults from '../components/practice/PracticeResults';
import QuestionCard from '../components/practice/QuestionCard';
import { ButtonLink } from '../components/ui/Button';
import { PageContainer, PageHeader } from '../components/ui/Page';
import { ApiErrorNotice, LoadingState } from '../components/ui/States';
import type { Quiz } from '../types/api';

// Start on the first unanswered question so a reloaded page resumes where the student stopped
const firstUnanswered = (quiz: Quiz) => {
  const index = quiz.questions.findIndex((q) => !q.userAnswer);
  return index === -1 ? quiz.questions.length - 1 : index;
};

/**
 * Answers a saved quiz or practice set, resuming where the student stopped. Practice sets ask for typed
 * answers with bilingual feedback; article quizzes show a, an and the.
 */
const PracticeSetPage = () => {
  const { token } = useRequireAuth();
  const { id } = useParams();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [answerError, setAnswerError] = useState<unknown>(null);
  const [movedOn, setMovedOn] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token || !id) return;

    let active = true;
    setLoadError(null);
    apiCall<Quiz>(`/quiz/${encodeURIComponent(id)}`)
      .then((data) => {
        if (!active) return;
        setQuiz(data);
        setCurrentIndex(firstUnanswered(data));
        setShowResults(data.isCompleted && data.questions.every((q) => q.userAnswer));
      })
      .catch((err: unknown) => {
        if (active) setLoadError(err);
      });

    return () => {
      active = false;
    };
  }, [token, id, attempt]);

  const question = quiz?.questions[currentIndex];
  const bilingual = quiz?.questions.some((q) => q.answerType === 'text') ?? false;

  const submitAnswer = async (answer: string) => {
    if (!quiz || !question) return;

    setIsSubmitting(true);
    setAnswerError(null);
    try {
      setQuiz(await apiCall<Quiz>(`/quiz/${quiz.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ questionId: question.id, answer })
      }));
    } catch (err) {
      // Nothing was recorded, so the student can simply try again
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

  const notFound = loadError instanceof ApiError && loadError.status === 404;

  return (
    <PageContainer width="reading">
      {quiz?.sourceAnalysisId && (
        <Link
          to={`/questions/${quiz.sourceAnalysisId}`}
          className="mb-6 inline-block font-semibold text-brand-forest underline-offset-4 hover:underline"
        >
          ← Back to the original question
        </Link>
      )}

      <PageHeader
        eyebrow={quiz?.topic ? quiz.topic.nameEn : quiz ? 'Article quiz' : 'Practice'}
        title={quiz ? quiz.title : 'Practice'}
        documentTitle={quiz ? quiz.title : 'Practice'}
      />

      <div className="space-y-6">
        {loadError !== null && (
          <>
            <ApiErrorNotice
              error={loadError}
              title={notFound ? 'We couldn’t find this practice set' : 'We couldn’t load this practice set'}
              onRetry={notFound ? undefined : () => setAttempt((n) => n + 1)}
            />
            {notFound && <ButtonLink to="/analyze" variant="secondary">Analyze a question</ButtonLink>}
          </>
        )}
        {!quiz && loadError === null && <LoadingState label="Loading practice…" />}

        {quiz && showResults && (
          <PracticeResults
            quiz={quiz}
            heading={bilingual ? 'Practice complete!' : 'Quiz Completed!'}
            actions={
              bilingual ? (
                <>
                  <ButtonLink to="/analyze">Analyze another question</ButtonLink>
                  {quiz.sourceAnalysisId && (
                    <ButtonLink to={`/questions/${quiz.sourceAnalysisId}`} variant="secondary">
                      Review the original question
                    </ButtonLink>
                  )}
                </>
              ) : (
                <ButtonLink to="/quiz">Start a new quiz</ButtonLink>
              )
            }
          />
        )}

        {quiz && question && !showResults && (
          <QuestionCard
            key={question.id}
            question={question}
            index={currentIndex}
            total={quiz.questions.length}
            score={quiz.score}
            bilingual={bilingual}
            isSubmitting={isSubmitting}
            error={answerError}
            onAnswer={(answer) => void submitAnswer(answer)}
            onNext={goToNext}
            focusOnMount={movedOn}
            headerAction={bilingual ? <LanguageToggle /> : undefined}
          />
        )}
      </div>
    </PageContainer>
  );
};

export default PracticeSetPage;

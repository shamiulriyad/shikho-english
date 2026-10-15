import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTopics } from '../hooks/useTopics';
import { apiCall } from '../utils/api';
import AnalysisResult from '../components/AnalysisResult';
import PracticeSetButton from '../components/PracticeSetButton';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Field';
import { PageContainer, PageHeader } from '../components/ui/Page';
import { AiProcessing, ApiErrorNotice } from '../components/ui/States';
import type { QuestionAnalysis } from '../types/api';

const MAX_QUESTION_LENGTH = 2000;
const MAX_ANSWER_LENGTH = 500;
const MIN_QUESTION_LENGTH = 3;

const AnalyzePage = () => {
  useRequireAuth();
  const topics = useTopics();
  const [searchParams] = useSearchParams();
  const [questionText, setQuestionText] = useState('');
  // ?topic=<code> preselects a topic (from the topics list); unknown codes are ignored below
  const [chosenTopic, setChosenTopic] = useState(searchParams.get('topic') ?? '');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [analysis, setAnalysis] = useState<QuestionAnalysis | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const resultRef = useRef<HTMLElement>(null);

  const topicCode = topics.some((topic) => topic.code === chosenTopic) ? chosenTopic : '';
  const canSubmit = questionText.trim().length >= MIN_QUESTION_LENGTH && !isLoading;

  // Move focus to a new result so keyboard and screen-reader users land on it
  useEffect(() => {
    if (analysis) resultRef.current?.focus();
  }, [analysis]);

  const analyze = async () => {
    if (questionText.trim().length < MIN_QUESTION_LENGTH) return;

    setError(null);
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
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void analyze();
  };

  return (
    <PageContainer width="reading">
      <PageHeader
        eyebrow="Question analysis"
        title="Analyze a Question"
        description={
          <>
            Paste an SSC English 2nd Paper grammar question. You'll get the answer, step-by-step reasoning and the rule in
            English and <span lang="bn">বাংলা</span>.
          </>
        }
      />

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-line bg-white px-5 py-6 shadow-paper sm:px-6">
          <Textarea
            id="analyze-question"
            label="Question"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            maxLength={MAX_QUESTION_LENGTH}
            showCount
            rows={5}
            required
            placeholder="e.g., Fill in the blank with a suitable article: She is ___ honest girl."
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Select id="analyze-topic" label="Topic (optional)" value={topicCode} onChange={(e) => setChosenTopic(e.target.value)}>
              <option value="">Detect automatically</option>
              {topics.map((topic) => (
                <option key={topic.code} value={topic.code}>
                  {topic.nameEn} ({topic.nameBn})
                </option>
              ))}
            </Select>

            <Input
              id="analyze-answer"
              label="Your answer (optional)"
              type="text"
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              maxLength={MAX_ANSWER_LENGTH}
              autoComplete="off"
              placeholder="We'll check it for you"
            />
          </div>

          <Button type="submit" size="lg" fullWidth disabled={!canSubmit} loading={isLoading} loadingText="Analyzing…">
            Analyze
          </Button>
        </form>

        {isLoading && <AiProcessing label="Analyzing your question…" />}
        {error !== null && !isLoading && (
          <ApiErrorNotice error={error} title="We couldn’t analyze this question" onRetry={() => void analyze()} />
        )}

        {analysis && <AnalysisResult ref={resultRef} analysis={analysis} />}
        {analysis && <PracticeSetButton analysisId={analysis.id} />}
      </div>
    </PageContainer>
  );
};

export default AnalyzePage;

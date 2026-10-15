import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { usePractice } from '../context/PracticeContext';
import { diffWords } from '../utils/diffWords';
import Badge from './ui/Badge';
import { Button } from './ui/Button';
import { Textarea } from './ui/Field';
import { AiProcessing, ApiErrorNotice } from './ui/States';
import type { PracticeResult } from '../types/api';

// Matches the backend's PracticeRequestDto
const MAX_SENTENCE_LENGTH = 500;

/** The student's sentence with the changes marked: removed words struck through, added words highlighted. */
const SentenceDiff = ({ before, after }: { before: string; after: string }) => (
  <p className="text-lg leading-relaxed text-ink" lang="en">
    {diffWords(before, after).map((part, index) =>
      part.type === 'same' ? (
        <span key={index}>{part.text}</span>
      ) : part.type === 'removed' ? (
        <del key={index} className="rounded bg-danger-soft px-0.5 text-danger decoration-2">
          <span className="sr-only">removed: </span>
          {part.text}
        </del>
      ) : (
        <ins key={index} className="rounded bg-success-soft px-0.5 font-semibold text-success no-underline">
          <span className="sr-only">added: </span>
          {part.text}
        </ins>
      )
    )}
  </p>
);

const SentenceResult = ({ result }: { result: PracticeResult }) => {
  const ref = useRef<HTMLElement>(null);

  // Land keyboard and screen-reader users on the result
  useEffect(() => {
    ref.current?.focus();
  }, [result.id]);

  return (
    <article ref={ref} tabIndex={-1} className="rounded-lg border border-line bg-white shadow-paper focus:outline-none">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        {result.isCorrect ? (
          <p className="font-semibold text-success">✓ Your sentence is correct.</p>
        ) : (
          <p className="font-semibold text-danger">
            ✗ {result.mistakes.length === 1 ? '1 mistake found' : `${result.mistakes.length} mistakes found`}
          </p>
        )}
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-6">
        {result.isCorrect ? (
          <p className="text-lg text-ink" lang="en">{result.originalSentence}</p>
        ) : (
          <>
            <section>
              <h2 className="mb-2 text-sm font-semibold text-brand-terracotta">What changed</h2>
              <SentenceDiff before={result.originalSentence} after={result.correctedSentence} />
            </section>
            <section>
              <h2 className="mb-2 text-sm font-semibold text-brand-terracotta">Corrected</h2>
              <p className="text-lg font-semibold text-brand-forest" lang="en">{result.correctedSentence}</p>
            </section>
          </>
        )}

        {result.mistakes.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-brand-terracotta">Mistakes</h2>
            <ul className="space-y-3">
              {result.mistakes.map((mistake, index) => (
                <li key={index} className="rounded-md border border-line px-4 py-3">
                  <p className="flex flex-wrap items-center gap-2" lang="en">
                    <del className="text-danger">{mistake.original}</del>
                    <span aria-hidden="true" className="text-ink-muted">→</span>
                    <span className="sr-only">should be</span>
                    <ins className="font-semibold text-success no-underline">{mistake.correction}</ins>
                    {mistake.type && <Badge>{mistake.type}</Badge>}
                  </p>
                  <p className="mt-1 text-ink-muted">{mistake.reason}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="border-l-4 border-brand-terracotta bg-paper px-4 py-3">
          <h2 className="mb-1 text-sm font-semibold text-brand-terracotta">Explanation</h2>
          <p className="text-ink">{result.explanation}</p>
        </section>
      </div>

      <p className="border-t border-line px-5 py-3 text-sm text-ink-muted sm:px-6">
        AI-generated feedback. It can make mistakes, so check with your teacher or textbook when unsure.
      </p>
    </article>
  );
};

const PracticeSentenceInput = () => {
  const [sentence, setSentence] = useState('');
  const { submitSentence } = usePractice();
  // Local: the context's isLoading is also true while the history loads
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [error, setError] = useState<unknown>(null);

  const check = async () => {
    if (!sentence.trim() || isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      setResult(await submitSentence(sentence));
    } catch (err) {
      setResult(null);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void check();
  };

  // A sentence is one line: Enter checks it, Shift+Enter still adds a line break
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-line bg-white px-5 py-6 shadow-paper sm:px-6">
        <Textarea
          id="practice-sentence"
          label="Enter a sentence to check"
          hint="Focus: articles (a, an, the). Press Enter to check, Shift+Enter for a new line."
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_SENTENCE_LENGTH}
          showCount
          rows={3}
          placeholder="e.g., She is a good student."
        />
        <Button type="submit" size="lg" fullWidth disabled={!sentence.trim()} loading={isLoading} loadingText="Checking…">
          Check Grammar
        </Button>
      </form>

      {isLoading && <AiProcessing label="Checking your sentence…" />}
      {error !== null && !isLoading && (
        <ApiErrorNotice error={error} title="We couldn’t check this sentence" onRetry={() => void check()} />
      )}
      {result && <SentenceResult result={result} />}
    </div>
  );
};

export default PracticeSentenceInput;

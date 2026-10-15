import type { Ref } from 'react';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './LanguageToggle';
import Badge from './ui/Badge';
import type { QuestionAnalysis } from '../types/api';

const LABELS = {
  en: {
    topic: 'Topic',
    question: 'Question',
    answer: 'Correct answer',
    steps: 'Step by step',
    rule: 'Grammar rule',
    mistakes: 'Common mistakes',
    yourAnswer: 'Your answer',
    correct: '✓ Correct',
    incorrect: '✗ Not quite',
    disclaimer: 'AI-generated explanation. It can make mistakes, so check with your teacher or textbook when unsure.'
  },
  bn: {
    topic: 'বিষয়',
    question: 'প্রশ্ন',
    answer: 'সঠিক উত্তর',
    steps: 'ধাপে ধাপে',
    rule: 'ব্যাকরণের নিয়ম',
    mistakes: 'সাধারণ ভুল',
    yourAnswer: 'তোমার উত্তর',
    correct: '✓ সঠিক',
    incorrect: '✗ সঠিক হয়নি',
    disclaimer: 'এই ব্যাখ্যা AI তৈরি করেছে। ভুল হতে পারে, তাই নিশ্চিত না হলে শিক্ষক বা পাঠ্যবই দেখে নাও।'
  }
} as const;

const sectionLabel = 'mb-2 text-sm font-semibold text-brand-terracotta';

/** An analysis laid out like an annotated worksheet. Focusable so a new result can receive focus. */
const AnalysisResult = ({ analysis, ref }: { analysis: QuestionAnalysis; ref?: Ref<HTMLElement> }) => {
  const { language, pick } = useLanguage();
  const labels = LABELS[language];
  const feedback = analysis.studentAnswer;

  return (
    <article
      ref={ref}
      tabIndex={-1}
      className="rounded-lg border border-line bg-white shadow-paper focus:outline-none"
      lang={language}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 sm:px-6">
        <Badge tone="brand">
          {labels.topic}: {language === 'bn' ? analysis.topic.nameBn : analysis.topic.nameEn}
        </Badge>
        <LanguageToggle />
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-6">
        <section>
          <h2 className={sectionLabel}>{labels.question}</h2>
          <p className="whitespace-pre-wrap rounded-md bg-paper px-4 py-3 text-ink" lang="en">{analysis.questionText}</p>
        </section>

        <section>
          <h2 className={sectionLabel}>{labels.answer}</h2>
          <p
            className="inline-block whitespace-pre-wrap text-h2 text-brand-forest underline decoration-brand-amber decoration-[3px] underline-offset-[6px]"
            lang="en"
          >
            {analysis.correctAnswer}
          </p>
        </section>

        {feedback && (
          <section className={`rounded-md border-l-4 px-4 py-3 ${feedback.isCorrect ? 'border-success bg-success-soft' : 'border-danger bg-danger-soft'}`}>
            <h2 className="text-sm font-semibold text-ink">
              {labels.yourAnswer}: <span lang="en">{feedback.answer}</span>
            </h2>
            <p className={`mt-1 font-semibold ${feedback.isCorrect ? 'text-success' : 'text-danger'}`}>
              {feedback.isCorrect ? labels.correct : labels.incorrect}
            </p>
            <p className="mt-1 text-ink">{pick(feedback)}</p>
          </section>
        )}

        <section>
          <h2 className={sectionLabel}>{labels.steps}</h2>
          <ol className="space-y-3">
            {analysis.steps.map((step, index) => (
              <li key={index} className="flex gap-3 text-ink">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-info-soft text-sm font-semibold text-brand-forest"
                >
                  {index + 1}
                </span>
                <span>{pick(step)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-l-4 border-brand-terracotta bg-paper px-4 py-3">
          <h2 className={sectionLabel}>{labels.rule}</h2>
          <p className="text-ink">{pick(analysis.rule)}</p>
        </section>

        {analysis.commonMistakes.length > 0 && (
          <section>
            <h2 className={sectionLabel}>{labels.mistakes}</h2>
            <ul className="space-y-2">
              {analysis.commonMistakes.map((mistake, index) => (
                <li key={index} className="flex gap-3 text-ink">
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-amber" />
                  <span>{pick(mistake)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <p className="border-t border-line px-5 py-3 text-sm text-ink-muted sm:px-6">{labels.disclaimer}</p>
    </article>
  );
};

export default AnalysisResult;

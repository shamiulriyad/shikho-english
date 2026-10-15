import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ButtonLink } from '../ui/Button';
import SectionIntro from './SectionIntro';

// Hand-written example, labelled as such on the page. Nothing is sent to the backend.
const STEPS = [
  { label: 'Read', caption: 'Read the sentence. Does anything sound wrong?' },
  { label: 'Spot', caption: 'Two words don’t fit the grammar.' },
  { label: 'Understand', caption: 'Here is why each one is wrong.' },
  { label: 'Clarity', caption: 'Clear, correct and easy to remember.' }
] as const;

const FIXES = [
  {
    wrong: 'a',
    right: 'an',
    topic: 'Articles',
    en: 'Honest begins with a vowel sound (the h is silent), so it takes an.',
    bn: 'honest শব্দের h উচ্চারিত হয় না, তাই এর আগে an বসে।'
  },
  {
    wrong: 'tell',
    right: 'tells',
    topic: 'Right form of verbs',
    en: 'Who refers to “a man”, one person, so the present-simple verb takes -s.',
    bn: 'who এখানে একজন man-কে বোঝায়, তাই present simple-এ ক্রিয়ার সাথে -s যোগ হয়।'
  }
] as const;

// "My brother is ⟨a⟩ honest man who never ⟨tell⟩ lies."
const SENTENCE: (string | number)[] = ['My brother is ', 0, ' honest man who never ', 1, ' lies.'];

const Mistake = ({ index, step }: { index: number; step: number }) => {
  const fix = FIXES[index]!;
  if (step === 0) return <span>{fix.wrong}</span>;
  if (step < 3) {
    return (
      <mark className="rounded-sm bg-transparent px-0.5 text-brand-ivory underline decoration-brand-amber decoration-wavy decoration-2 underline-offset-[0.25em]">
        {fix.wrong}
        <sup aria-hidden="true" className="ml-0.5 text-[0.45em] font-bold text-brand-amber">{index + 1}</sup>
        <span className="sr-only"> (mistake {index + 1})</span>
      </mark>
    );
  }
  return (
    <span className="whitespace-nowrap">
      <del className="text-brand-ivory/70 decoration-2">
        <span className="sr-only">removed: </span>
        {fix.wrong}
      </del>{' '}
      <ins className="rounded-sm bg-brand-amber px-1 font-semibold text-brand-forest no-underline">
        <span className="sr-only">added: </span>
        {fix.right}
      </ins>
    </span>
  );
};

/** "From confusion to clarity": a four-step, self-contained walk from a faulty sentence to a correct one. */
const ClarityDemo = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const last = STEPS.length - 1;

  return (
    <section
      id="clarity"
      tabIndex={-1}
      aria-labelledby="clarity-heading"
      className="on-dark scroll-mt-4 bg-brand-forest px-4 py-20 text-brand-ivory focus:outline-none sm:px-6 lg:py-28"
    >
      <div className="mx-auto max-w-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionIntro
            id="clarity-heading"
            tone="dark"
            kicker="Interactive example"
            title="From confusion to clarity."
            intro="Every explanation in Shikho English moves the same way: notice the problem, understand the rule, then see the sentence that works."
          />
          <p className="rounded bg-white/10 px-3 py-1 text-sm text-brand-ivory/85">Example written for this page</p>
        </div>

        {/* Step selector: a matra line with the four steps hanging from it */}
        <ol className="mt-12 grid grid-cols-4 border-t-[3px] border-brand-ivory/25">
          {STEPS.map((item, index) => {
            const isCurrent = index === step;
            const done = index < step;
            return (
              <li key={item.label} className="relative">
                <span
                  aria-hidden="true"
                  className={`absolute -top-[3px] left-0 h-[3px] w-full transition-colors ${index <= step ? 'bg-brand-amber' : 'bg-transparent'}`}
                />
                <button
                  type="button"
                  onClick={() => setStep(index)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`flex min-h-11 w-full flex-col items-start gap-1 pt-4 text-left transition-colors ${
                    isCurrent ? 'text-brand-ivory' : done ? 'text-brand-ivory/85 hover:text-brand-ivory' : 'text-brand-ivory/70 hover:text-brand-ivory'
                  }`}
                >
                  <span className={`text-sm font-semibold ${isCurrent ? 'text-brand-amber' : ''}`}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={`text-sm sm:text-base ${isCurrent ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
          <div>
            <p aria-live="polite" className="text-sm font-semibold text-brand-amber">
              {STEPS[step]!.caption}
            </p>
            <p lang="en" className="mt-5 text-[clamp(1.7rem,3.6vw,3rem)] font-medium leading-[1.4] tracking-[-0.02em] text-brand-ivory">
              {SENTENCE.map((part, index) =>
                typeof part === 'string' ? <span key={index}>{part}</span> : <Mistake key={index} index={part} step={step} />
              )}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={step === 0}
                className="min-h-11 rounded-md border border-brand-ivory/40 px-5 font-semibold text-brand-ivory transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              {step < last ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="min-h-11 rounded-md bg-brand-ivory px-5 font-semibold text-brand-forest transition-colors hover:bg-white"
                >
                  Next: {STEPS[step + 1]!.label}
                </button>
              ) : (
                <ButtonLink to={user ? '/analyze' : '/register'} variant="accent" className="min-h-11">
                  Try it with your own question
                </ButtonLink>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {step < 2 ? (
              <p className="border-l-2 border-brand-ivory/25 pl-5 text-brand-ivory/80">
                {step === 0
                  ? 'Read it the way you would in an exam. Trust your ear first, then check the grammar.'
                  : 'The marked words break a rule. Before reading on, can you say which rule?'}
              </p>
            ) : (
              FIXES.map((fix, index) => (
                <div key={fix.wrong} className="animate-fade rounded-md border border-brand-ivory/15 bg-white/5 px-5 py-4">
                  <p className="text-sm font-semibold text-brand-amber">
                    {index + 1} · {fix.topic}
                  </p>
                  <p className="mt-1 text-lg" lang="en">
                    <span className="text-brand-ivory/80 line-through">{fix.wrong}</span>
                    <span aria-hidden="true" className="mx-2 text-brand-ivory/70">→</span>
                    <span className="sr-only"> should be </span>
                    <span className="font-semibold text-brand-amber">{fix.right}</span>
                  </p>
                  <p className="mt-2 text-brand-ivory/90">{fix.en}</p>
                  <p className="mt-1 text-brand-ivory/75" lang="bn">{fix.bn}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClarityDemo;

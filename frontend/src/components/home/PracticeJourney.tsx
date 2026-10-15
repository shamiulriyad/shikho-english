import { Link } from 'react-router-dom';
import SectionIntro from './SectionIntro';

// The real workflow, step by step. Every link goes to an existing page (signed-out visitors log in first
// and come straight back).
const STEPS = [
  {
    title: 'Analyze',
    body: 'Paste a grammar question from your book or a past paper. Add your own answer if you want it checked.',
    links: [{ to: '/analyze', label: 'Analyze a question' }]
  },
  {
    title: 'Understand',
    body: 'Read the answer, the steps and the rule, in English or বাংলা, with the mistakes students often make.',
    links: []
  },
  {
    title: 'Practise',
    body: 'Turn the question into similar practice questions, check sentences of your own, or take a quick article quiz.',
    links: [
      { to: '/practice', label: 'Sentence Check' },
      { to: '/quiz', label: 'Quiz' }
    ]
  },
  {
    title: 'Review',
    body: 'Reopen any past question and see how accurate you are in each topic.',
    links: [
      { to: '/history', label: 'History' },
      { to: '/progress', label: 'Progress' }
    ]
  }
] as const;

/**
 * Section C: "Practice with purpose." The steps hang from one long matra line, the way Bangla letters hang
 * from their headline stroke. On phones the line runs down the left instead.
 */
const PracticeJourney = () => (
  <section aria-labelledby="journey-heading" className="px-4 py-20 sm:px-6 lg:py-28">
    <div className="mx-auto max-w-page">
      <SectionIntro
        id="journey-heading"
        number={3}
        kicker="How it works"
        title="Practice with purpose."
        intro="One difficult question becomes a short, focused routine."
      />

      <div className="relative mt-16">
        {/* The matra the steps hang from (desktop) */}
        <span aria-hidden="true" className="absolute inset-x-0 top-0 hidden items-center gap-2 lg:flex">
          <span className="h-[3px] flex-1 rounded-full bg-brand-forest" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand-amber" />
        </span>

        <ol className="relative border-l-[3px] border-brand-forest pl-8 lg:grid lg:grid-cols-4 lg:gap-8 lg:border-l-0 lg:pl-0">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative pb-12 last:pb-0 lg:pb-0 lg:pt-14">
              {/* Stem from the line to the step */}
              <span aria-hidden="true" className="absolute left-0 top-0 hidden h-14 w-[3px] bg-brand-forest lg:block" />
              <span aria-hidden="true" className="absolute -left-[2.45rem] top-1 h-4 w-4 rounded-full border-[3px] border-brand-forest bg-paper lg:hidden" />

              <p className="text-[clamp(2.5rem,4vw,3.25rem)] font-bold leading-none tracking-[-0.03em] text-brand-forest/15" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-2 text-h2 text-brand-forest">{step.title}</h3>
              <p className="mt-2 text-ink-muted">{step.body}</p>
              {step.links.length > 0 && (
                <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  {step.links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="font-semibold text-brand-forest underline decoration-brand-amber decoration-2 underline-offset-4 transition-colors hover:text-brand-terracotta"
                    >
                      {link.label}
                    </Link>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  </section>
);

export default PracticeJourney;

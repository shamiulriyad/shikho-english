import { useAuth } from '../../context/AuthContext';
import { ButtonLink } from '../ui/Button';
import SectionIntro from './SectionIntro';

type Part = { text: string; role: string; detail?: string; key?: boolean };

// "Every morning, my sister reads the newspaper aloud." Checked by hand.
const OPENING: Part = { text: 'Every morning,', role: 'Time' };
const SUBJECT: Part = { text: 'my sister', role: 'Subject', detail: 'one person', key: true };
const VERB: Part = { text: 'reads', role: 'Verb', detail: 'present simple + s', key: true };
const CLOSING: Part[] = [
  { text: 'the newspaper', role: 'Object' },
  { text: 'aloud.', role: 'Manner' }
];

/** One bracketed chunk: big text with its role underneath (desktop) or beside it (phones). */
const Chunk = ({ part }: { part: Part }) => (
  <span className="flex items-baseline justify-between gap-4 border-b border-line py-3 md:block md:border-0 md:py-0">
    <span
      className={`block text-[clamp(1.6rem,3vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] md:border-b-2 md:pb-2 ${
        part.key ? 'text-brand-forest md:border-brand-terracotta' : 'text-ink md:border-line-strong'
      }`}
    >
      {part.text}
    </span>
    <span className="block shrink-0 text-right md:mt-2 md:text-left">
      <span className={`block text-sm font-semibold ${part.key ? 'text-brand-terracotta' : 'text-ink-muted'}`}>{part.role}</span>
      {part.detail && <span className="block text-sm text-ink-muted">{part.detail}</span>}
    </span>
  </span>
);

/** Section B: "See what makes a sentence work." A sentence diagram with an agreement arc. */
const SentenceAnatomy = () => {
  const { user } = useAuth();

  return (
    <section aria-labelledby="anatomy-heading" className="border-y border-line bg-white px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-page">
        <SectionIntro
          id="anatomy-heading"
          number={2}
          kicker="Inside a sentence"
          title="See what makes a sentence work."
          intro="Words lean on each other. When you see how the parts connect, the right answer stops being a guess."
        />

        {/* The diagram. Read as one sentence by screen readers; the arcs and brackets are decoration. */}
        <figure className="mt-14">
          <p lang="en" className="flex flex-col md:flex-row md:flex-wrap md:items-start md:gap-x-6 md:gap-y-10 md:pt-12">
            <Chunk part={OPENING} />
            {/* Subject and verb share an arc: they must agree */}
            <span className="relative flex flex-col md:flex-row md:gap-6">
              <span aria-hidden="true" className="absolute inset-x-[18%] -top-10 hidden h-8 rounded-t-[999px] border-x-2 border-t-2 border-brand-terracotta md:block" />
              <span aria-hidden="true" className="absolute -top-10 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm font-semibold text-brand-terracotta md:block">
                agree
              </span>
              <Chunk part={SUBJECT} />
              <span aria-hidden="true" className="flex items-center gap-2 py-2 text-sm font-semibold text-brand-terracotta md:hidden">
                <span className="h-6 w-px bg-brand-terracotta" /> agrees with
              </span>
              <Chunk part={VERB} />
            </span>
            {CLOSING.map((part) => (
              <Chunk key={part.text} part={part} />
            ))}
          </p>

          <figcaption className="mt-12 grid gap-8 border-t border-line pt-8 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <div>
              <p className="text-h3 text-brand-forest">Why reads, not read?</p>
              <p className="mt-2 text-lg text-ink">
                “My sister” is one person (third person singular), so a present-simple verb takes -s.
              </p>
              <p className="mt-1 text-ink-muted" lang="bn">
                my sister একজন (third person singular), তাই present simple-এ ক্রিয়ার সাথে -s যোগ হয়।
              </p>
            </div>
            <div className="border-l-4 border-brand-terracotta bg-paper px-5 py-4">
              <p className="text-ink">
                Every question you analyse gets this kind of reasoning: the answer, the steps, the rule and the mistakes
                students often make, in English and <span lang="bn">বাংলা</span>.
              </p>
              <ButtonLink to={user ? '/analyze' : '/register'} variant="secondary" className="mt-4">
                Analyze a question
              </ButtonLink>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
};

export default SentenceAnatomy;

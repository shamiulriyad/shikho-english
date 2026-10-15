import SectionIntro from './SectionIntro';

// Real SSC English 2nd Paper patterns (topics from the backend's topic list). Examples checked by hand.
const PATTERNS = [
  { pattern: 'a / an', example: ['an hour · a university · an ', 'honest', ' man'], topicEn: 'Articles', topicBn: 'আর্টিকেল' },
  { pattern: 'since / for', example: ['', 'since', ' 2020 · for two years'], topicEn: 'Prepositions', topicBn: 'প্রিপজিশন' },
  { pattern: 'has been + -ing', example: ['She ', 'has been studying', ' since morning.'], topicEn: 'Right form of verbs', topicBn: 'ক্রিয়ার সঠিক রূপ' },
  { pattern: '…, isn’t it?', example: ['It is hot today, ', 'isn’t it', '?'], topicEn: 'Tag questions', topicBn: 'ট্যাগ প্রশ্ন' },
  { pattern: 'said that …', example: ['He ', 'said that', ' he was busy.'], topicEn: 'Narration', topicBn: 'উক্তি পরিবর্তন' }
] as const;

/** Section A: "English has a pattern." A staggered type specimen instead of feature cards. */
const PatternSection = () => (
  <section aria-labelledby="pattern-heading" className="px-4 py-20 sm:px-6 lg:py-28">
    <div className="mx-auto grid max-w-page gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
      <div className="lg:sticky lg:top-10 lg:self-start">
        <SectionIntro
          id="pattern-heading"
          number={1}
          kicker="The approach"
          title="English has a pattern."
          intro="Grammar isn’t a pile of random rules. The same small patterns return in your textbook, in exams and in everyday English. Every Shikho English explanation names the rule behind the answer, so the next question looks familiar."
        />
      </div>

      <ol className="border-t border-line">
        {PATTERNS.map((item, index) => (
          <li
            key={item.pattern}
            className={`grid gap-2 border-b border-line py-7 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-6 ${index % 2 === 1 ? 'sm:pl-16' : ''}`}
          >
            <div>
              <p className="text-[clamp(1.75rem,3.4vw,2.6rem)] font-semibold leading-tight tracking-[-0.025em] text-brand-forest" lang="en">
                {item.pattern}
              </p>
              <p className="mt-2 text-lg text-ink-muted" lang="en">
                {item.example[0]}
                <span className="font-semibold text-ink underline decoration-brand-amber decoration-2 underline-offset-4">{item.example[1]}</span>
                {item.example[2]}
              </p>
            </div>
            <p className="text-sm sm:text-right">
              <span className="font-semibold text-brand-terracotta">{item.topicEn}</span>
              <span className="block text-ink-muted" lang="bn">{item.topicBn}</span>
            </p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default PatternSection;

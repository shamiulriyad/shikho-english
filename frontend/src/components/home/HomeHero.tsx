import { useAuth } from '../../context/AuthContext';
import { ButtonLink } from '../ui/Button';
import SentenceStudio from './SentenceStudio';

/** Asymmetric editorial hero: expressive type on the left, the Sentence Studio on the right. */
const HomeHero = () => {
  const { user } = useAuth();

  return (
    <section aria-labelledby="hero-heading" className="overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:pb-24 lg:pt-20">
      <div className="mx-auto grid max-w-page items-start gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
        <div className="lg:pt-4">
          <p className="mb-6 flex animate-rise items-center gap-3 text-sm font-semibold text-brand-terracotta">
            <span aria-hidden="true" className="flex items-center gap-1.5">
              <span className="h-[3px] w-10 rounded-full bg-brand-forest" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-amber" />
            </span>
            English practice, with clarity
          </p>

          <h1 id="hero-heading" className="text-[clamp(2.9rem,7vw,5.6rem)] leading-[0.98] tracking-[-0.035em] text-brand-forest">
            {/* Real spaces between the lines keep the accessible name (and copied text) readable */}
            <span className="block animate-rise font-bold [animation-delay:80ms]">English,</span>{' '}
            <span className="block animate-rise font-normal text-brand-forest/90 [animation-delay:160ms]">finally</span>{' '}
            <span className="block animate-rise font-bold [animation-delay:240ms]">
              making{' '}
              <span className="relative whitespace-nowrap">
                sense.
                <span aria-hidden="true" className="absolute -bottom-1 left-0 h-[0.12em] w-full rounded-full bg-brand-amber" />
              </span>
            </span>
          </h1>

          <p className="mt-8 max-w-md animate-rise text-xl leading-relaxed text-ink [animation-delay:320ms]">
            Understand the rules. Discover the patterns. Build confidence one sentence at a time.
          </p>
          <p className="mt-3 max-w-md animate-rise text-ink-muted [animation-delay:360ms]">
            Paste an SSC English grammar question and see the answer, the reasoning and the rule, in English and{' '}
            <span lang="bn">বাংলা</span>.
          </p>

          <div className="mt-9 flex animate-rise flex-wrap gap-3 [animation-delay:420ms]">
            <ButtonLink to={user ? '/analyze' : '/register'} size="lg">
              Start Learning
            </ButtonLink>
            <ButtonLink to={{ hash: '#clarity' }} size="lg" variant="secondary">
              Explore the Experience
            </ButtonLink>
          </div>

          <p className="mt-10 animate-rise border-t border-line pt-5 text-sm text-ink-muted [animation-delay:480ms]">
            For SSC English 2nd Paper · <span lang="bn">ইংরেজি দ্বিতীয় পত্র</span>
          </p>
        </div>

        <div className="animate-rise [animation-delay:200ms] lg:mt-6">
          <SentenceStudio />
        </div>
      </div>
    </section>
  );
};

export default HomeHero;

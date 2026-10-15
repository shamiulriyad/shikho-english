import { useAuth } from '../../context/AuthContext';
import { ButtonLink } from '../ui/Button';

/**
 * Section F: the closing statement. The story ends where it began (one sentence at a time), set large,
 * with the matra running under the final phrase.
 */
const ClosingCta = () => {
  const { user } = useAuth();

  return (
    <section aria-labelledby="closing-heading" className="px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto grid max-w-page items-end gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <h2
          id="closing-heading"
          className="text-[clamp(2.6rem,6.5vw,5.25rem)] font-bold leading-[1.02] tracking-[-0.035em] text-brand-forest"
        >
          <span className="block font-normal">Every sentence</span>{' '}
          <span className="block">can make sense.</span>
          <span aria-hidden="true" className="mt-6 flex max-w-xl items-center gap-2">
            <span className="h-[5px] flex-1 rounded-full bg-brand-forest" />
            <span className="h-3 w-3 rounded-full bg-brand-amber" />
          </span>
        </h2>

        <div className="lg:pb-6">
          <p className="text-lg leading-relaxed text-ink">
            Start with one question you found difficult. Read why the answer is right, then practise until the pattern feels
            natural.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to={user ? '/analyze' : '/register'} size="lg">
              Start Learning
            </ButtonLink>
            <ButtonLink to="/topics" size="lg" variant="secondary">
              Browse topics
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClosingCta;

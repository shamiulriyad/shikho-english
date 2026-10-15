import type { ReactNode } from 'react';

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const twoDigits = (n: number) => String(n).padStart(2, '0');
const toBangla = (text: string) => text.replace(/\d/g, (d) => BANGLA_DIGITS[Number(d)] ?? d);

interface SectionIntroProps {
  id: string;
  /** Section number, shown in both scripts (০১ / 01) */
  number?: number;
  kicker?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  /** `dark` for forest-green sections */
  tone?: 'light' | 'dark';
  className?: string;
}

/** Heading block shared by the homepage sections: matra rule, bilingual number, title, intro. */
const SectionIntro = ({ id, number, kicker, title, intro, tone = 'light', className = '' }: SectionIntroProps) => {
  const dark = tone === 'dark';
  return (
    <div className={`max-w-reading ${className}`}>
      <span aria-hidden="true" className="mb-5 flex items-center gap-1.5">
        <span className={`h-[3px] w-10 rounded-full ${dark ? 'bg-brand-ivory' : 'bg-brand-forest'}`} />
        <span className="h-1.5 w-1.5 rounded-full bg-brand-amber" />
      </span>
      {(number !== undefined || kicker) && (
        <p className={`mb-3 text-sm font-semibold ${dark ? 'text-brand-amber' : 'text-brand-terracotta'}`}>
          {number !== undefined && (
            <>
              <span lang="bn">{toBangla(twoDigits(number))}</span> / {twoDigits(number)}
              {kicker && <span aria-hidden="true"> · </span>}
            </>
          )}
          {kicker}
        </p>
      )}
      <h2 id={id} className={`text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.1] tracking-[-0.025em] ${dark ? 'text-brand-ivory' : 'text-brand-forest'}`}>
        {title}
      </h2>
      {intro && <p className={`mt-4 text-lg leading-relaxed ${dark ? 'text-brand-ivory/85' : 'text-ink-muted'}`}>{intro}</p>}
    </div>
  );
};

export default SectionIntro;

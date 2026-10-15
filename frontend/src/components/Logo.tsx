import { useId } from 'react';

// Brand mark geometry on a 48 x 48 grid. Keep in sync with public/brand/*.svg and public/favicon.svg.
// A speech bubble (dialogue) holding an English "S" hung from a Bangla matra (headline), with an amber spark.
const BUBBLE = 'M4 44V16A12 12 0 0 1 16 4h16a12 12 0 0 1 12 12v16a12 12 0 0 1-12 12Z';
const GLYPH =
  'M12 13h19.5M29.5 13C21.5 13 17 15.3 17 19.7c0 5 5.6 5.6 9.2 6.6 3.4.9 5.3 2.6 5.3 5.4 0 3.4-3.2 5.3-7.6 5.3-3.4 0-6-1.1-8-3.1';

/** `light` for ivory/white backgrounds, `dark` for forest/dark backgrounds, `mono` follows currentColor. */
export type LogoTone = 'light' | 'dark' | 'mono';

const MARK_COLORS = {
  light: { bubble: '#173B35', glyph: '#F7F5EF', spark: '#D99B3D' },
  dark: { bubble: '#F7F5EF', glyph: '#173B35', spark: '#A84F2D' },
} as const;

const WORDMARK_CLASSES: Record<LogoTone, [string, string]> = {
  light: ['text-brand-forest', 'text-brand-terracotta'],
  dark: ['text-brand-ivory', 'text-brand-amber'],
  mono: ['', ''],
};

interface LogoMarkProps {
  size?: number;
  tone?: LogoTone;
  /** Accessible name; omit when the mark sits next to visible "Shikho English" text. */
  title?: string;
  className?: string;
}

export const LogoMark = ({ size = 32, tone = 'light', title, className }: LogoMarkProps) => {
  const maskId = useId();
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true };

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} {...a11y}>
      {title && <title>{title}</title>}
      {tone === 'mono' ? (
        <>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
            <rect width="48" height="48" fill="#fff" />
            <path fill="none" stroke="#000" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" d={GLYPH} />
            <circle cx="37.6" cy="13" r="2.6" fill="#000" />
          </mask>
          <path fill="currentColor" mask={`url(#${maskId})`} d={BUBBLE} />
        </>
      ) : (
        <>
          <path fill={MARK_COLORS[tone].bubble} d={BUBBLE} />
          <path
            fill="none"
            stroke={MARK_COLORS[tone].glyph}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            d={GLYPH}
          />
          <circle cx="37.6" cy="13" r="2.6" fill={MARK_COLORS[tone].spark} />
        </>
      )}
    </svg>
  );
};

interface LogoProps {
  /** Height of the mark in px; the wordmark scales with it. */
  size?: number;
  tone?: LogoTone;
  className?: string;
}

/** Horizontal lockup: mark + "Shikho English" wordmark. */
const Logo = ({ size = 32, tone = 'light', className = '' }: LogoProps) => {
  const [first, second] = WORDMARK_CLASSES[tone];

  return (
    <span className={`inline-flex items-center whitespace-nowrap ${className}`} style={{ gap: size * 0.25 }}>
      <LogoMark size={size} tone={tone} />
      <span className="leading-none tracking-[-0.02em]" style={{ fontSize: size * 0.55 }}>
        <span className={`font-bold ${first}`}>Shikho</span> <span className={`font-semibold ${second}`}>English</span>
      </span>
    </span>
  );
};

export default Logo;

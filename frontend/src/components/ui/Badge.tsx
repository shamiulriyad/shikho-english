import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-paper text-ink-muted border-line',
  brand: 'bg-info-soft text-brand-forest border-transparent',
  success: 'bg-success-soft text-success border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
};

/** Short labels such as a topic or an answer status. Don't rely on colour alone: the text must say it. */
const Badge = ({ tone = 'neutral', lang, children }: { tone?: BadgeTone; lang?: string; children: ReactNode }) => (
  <span lang={lang} className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-sm font-medium ${TONES[tone]}`}>
    {children}
  </span>
);

export default Badge;

import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** One line saying exactly what the number counts */
  caption?: ReactNode;
}

/** A single figure with a plain-language label. The label comes first so screen readers hear context. */
const StatTile = ({ label, value, caption }: StatTileProps) => (
  <div className="rounded-lg border border-line bg-white px-5 py-4">
    <p className="text-sm font-semibold text-ink-muted">{label}</p>
    <p className="mt-1 text-h1 text-brand-forest">{value}</p>
    {caption && <p className="mt-1 text-sm text-ink-muted">{caption}</p>}
  </div>
);

export default StatTile;

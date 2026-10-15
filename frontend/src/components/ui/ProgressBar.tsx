interface ProgressBarProps {
  value: number;
  max: number;
  /** Accessible name, e.g. "Questions answered" */
  label: string;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
}

const TONES = { brand: 'bg-brand-forest', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' } as const;

const ProgressBar = ({ value, max, label, tone = 'brand' }: ProgressBarProps) => (
  <div
    role="progressbar"
    aria-label={label}
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={max}
    className="h-1.5 w-full overflow-hidden rounded-full bg-info-soft"
  >
    <div
      className={`h-full rounded-full ${TONES[tone]} transition-[width] duration-300 motion-reduce:transition-none`}
      style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }}
    />
  </div>
);

export default ProgressBar;

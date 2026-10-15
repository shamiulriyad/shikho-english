import type { ReactNode } from 'react';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

const TONES: Record<AlertTone, { box: string; title: string }> = {
  info: { box: 'border-info bg-info-soft', title: 'text-info' },
  success: { box: 'border-success bg-success-soft', title: 'text-success' },
  warning: { box: 'border-warning bg-warning-soft', title: 'text-warning' },
  error: { box: 'border-danger bg-danger-soft', title: 'text-danger' },
};

interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  /** A follow-up control such as a retry button */
  action?: ReactNode;
  className?: string;
}

/** Errors interrupt screen readers (role="alert"); other tones are announced politely (role="status"). */
const Alert = ({ tone = 'info', title, children, action, className = '' }: AlertProps) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    className={`rounded-md border-l-4 px-4 py-3 text-ink ${TONES[tone].box} ${className}`}
  >
    {title && <p className={`font-semibold ${TONES[tone].title}`}>{title}</p>}
    {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export default Alert;

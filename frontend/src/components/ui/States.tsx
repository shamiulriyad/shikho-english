import { useEffect, useState, type ReactNode } from 'react';
import { isRateLimited } from '../../utils/api';
import Alert from './Alert';
import { Button } from './Button';
import Spinner from './Spinner';

interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="rounded-md border border-dashed border-line-strong bg-white px-6 py-10 text-center">
    <p className="text-h3 text-brand-forest">{title}</p>
    {description && <p className="mx-auto mt-2 max-w-reading text-ink-muted">{description}</p>}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

/** Loading text for content that is being fetched. Announced politely. */
export const LoadingState = ({ label = 'Loading…' }: { label?: ReactNode }) => (
  <p role="status" className="flex items-center gap-2 text-ink-muted">
    <Spinner />
    {label}
  </p>
);

interface ErrorStateProps {
  title?: ReactNode;
  message: ReactNode;
  /** Runs only when the student presses the button; there is no automatic retry. */
  onRetry?: () => void;
  retryLabel?: ReactNode;
}

export const ErrorState = ({ title = 'Something went wrong', message, onRetry, retryLabel = 'Try again' }: ErrorStateProps) => (
  <Alert
    tone="error"
    title={title}
    action={onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>{retryLabel}</Button>}
  >
    {message}
  </Alert>
);

interface AiProcessingProps {
  label: ReactNode;
  detail?: ReactNode;
}

/** Shown while the AI works. The status region announces it once; the spinner is decorative. */
export const AiProcessing = ({ label, detail = 'This can take a few seconds.' }: AiProcessingProps) => (
  <div role="status" className="flex items-start gap-3 rounded-md border border-line bg-white px-4 py-3">
    <Spinner className="mt-1 h-4 w-4 text-brand-terracotta" />
    <div>
      <p className="font-medium text-ink">{label}</p>
      {detail && <p className="text-sm text-ink-muted">{detail}</p>}
    </div>
  </div>
);

const formatWait = (seconds: number) => {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes} min${rest ? ` ${rest} s` : ''}`;
};

interface RateLimitNoticeProps {
  /** Seconds from the server's Retry-After, or null when unknown */
  retryAfter: number | null;
  /** Shown as a button once waiting is over. Never called automatically. */
  onRetry?: () => void;
}

/**
 * Explains a 429. With a known wait it counts down and then enables "Try again"; without one it asks
 * the student to wait a minute. Screen readers hear the message when it appears and when the wait ends,
 * not every tick.
 */
export const RateLimitNotice = ({ retryAfter, onRetry }: RateLimitNoticeProps) => {
  const [remaining, setRemaining] = useState(retryAfter ?? 0);

  useEffect(() => {
    setRemaining(retryAfter ?? 0);
    if (!retryAfter) return;

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const left = Math.max(0, retryAfter - Math.floor((Date.now() - startedAt) / 1000));
      setRemaining(left);
      if (left === 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAfter]);

  const waiting = remaining > 0;

  return (
    <div className="rounded-md border-l-4 border-warning bg-warning-soft px-4 py-3 text-ink">
      <p className="font-semibold text-warning">Too many requests</p>
      <p role="status" className="mt-1">
        {retryAfter === null
          ? 'You have sent a lot of requests in a short time. Please wait a minute, then try again.'
          : waiting
            ? `You have sent a lot of requests in a short time. Please wait about ${formatWait(retryAfter)}.`
            : 'You can try again now.'}
      </p>
      {waiting && (
        <p aria-hidden="true" className="mt-1 text-sm text-ink-muted">
          Try again in {formatWait(remaining)}
        </p>
      )}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-3" disabled={waiting} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
};

interface ApiErrorNoticeProps {
  error: unknown;
  /** Heading for errors other than rate limiting */
  title?: ReactNode;
  /** Offered as a button; never called automatically */
  onRetry?: () => void;
}

/** One place to show a failed request: the rate-limit countdown for 429s, an error with a retry otherwise. */
export const ApiErrorNotice = ({ error, title, onRetry }: ApiErrorNoticeProps) => {
  if (isRateLimited(error)) {
    return <RateLimitNotice retryAfter={error.retryAfter} onRetry={onRetry} />;
  }
  const message = error instanceof Error ? error.message : String(error);
  return <ErrorState title={title} message={message} onRetry={onRetry} />;
};

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldShellProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Shown under the control, e.g. a character count */
  aside?: ReactNode;
  children: ReactNode;
}

const controlClasses = (hasError: boolean) =>
  [
    'block w-full rounded-md border bg-white px-3 py-2 text-ink placeholder:text-ink-muted',
    'focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-brand-forest',
    'disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-muted',
    hasError ? 'border-danger' : 'border-line-strong',
  ].join(' ');

const describedBy = (id: string, hint: unknown, error: unknown) =>
  [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;

const FieldShell = ({ id, label, hint, error, aside, children }: FieldShellProps) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
      {label}
    </label>
    {hint && (
      <p id={`${id}-hint`} className="mb-1.5 text-sm text-ink-muted">
        {hint}
      </p>
    )}
    {children}
    {(error || aside) && (
      <div className="mt-1 flex items-start justify-between gap-3 text-sm">
        {error ? (
          <p id={`${id}-error`} className="text-danger">
            {error}
          </p>
        ) : (
          <span />
        )}
        {aside && <span className="shrink-0 text-ink-muted">{aside}</span>}
      </div>
    )}
  </div>
);

interface FieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
}

export const Input = ({ id, label, hint, error, className = '', ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) => (
  <FieldShell id={id} label={label} hint={hint} error={error}>
    <input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, hint, error)}
      className={`${controlClasses(Boolean(error))} ${className}`}
      {...rest}
    />
  </FieldShell>
);

type TextareaProps = FieldProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    /** Shows "used/max" under the field; needs `maxLength` and a controlled `value`. */
    showCount?: boolean;
  };

export const Textarea = ({ id, label, hint, error, showCount = false, className = '', ...rest }: TextareaProps) => {
  const count = showCount && rest.maxLength ? `${String(rest.value ?? '').length}/${rest.maxLength}` : undefined;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} aside={count}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${controlClasses(Boolean(error))} ${className}`}
        {...rest}
      />
    </FieldShell>
  );
};

export const Select = ({ id, label, hint, error, className = '', children, ...rest }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) => (
  <FieldShell id={id} label={label} hint={hint} error={error}>
    <select
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, hint, error)}
      className={`${controlClasses(Boolean(error))} ${className}`}
      {...rest}
    >
      {children}
    </select>
  </FieldShell>
);

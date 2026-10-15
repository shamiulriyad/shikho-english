import { describe, expect, test, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Alert from './Alert';
import { Button, ButtonLink } from './Button';
import { Input, Select, Textarea } from './Field';
import { PageHeader } from './Page';
import { AiProcessing, EmptyState, ErrorState, LoadingState, RateLimitNotice } from './States';

describe('Button', () => {
  test('is a non-submitting button by default', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  test('loading disables it, marks it busy and swaps the label', () => {
    render(<Button loading loadingText="Saving…">Save</Button>);

    const button = screen.getByRole('button', { name: 'Saving…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  test('ButtonLink is a real link', () => {
    render(<MemoryRouter><ButtonLink to="/analyze">Analyze</ButtonLink></MemoryRouter>);

    expect(screen.getByRole('link', { name: 'Analyze' })).toHaveAttribute('href', '/analyze');
  });
});

describe('form fields', () => {
  test('label, hint and error are wired to the control', () => {
    render(<Input id="email" label="Email" hint="We never share it" error="Enter a valid email" />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('We never share it Enter a valid email');
  });

  test('a valid field is not marked invalid', () => {
    render(<Select id="topic" label="Topic"><option>Articles</option></Select>);

    expect(screen.getByLabelText('Topic')).not.toHaveAttribute('aria-invalid');
  });

  test('textarea shows how much of the limit is used', () => {
    render(<Textarea id="q" label="Question" value="abc" maxLength={2000} showCount onChange={() => {}} />);

    expect(screen.getByText('3/2000')).toBeInTheDocument();
  });
});

describe('feedback states', () => {
  test('errors interrupt, other alerts are polite', () => {
    render(
      <>
        <Alert tone="error">Broken</Alert>
        <Alert tone="success">Saved</Alert>
      </>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Broken');
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  test('ErrorState retries only when asked', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Could not load history" onRetry={onRetry} />);

    expect(onRetry).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('loading, empty and AI states are announced', () => {
    render(
      <>
        <LoadingState label="Loading history…" />
        <AiProcessing label="Analyzing your question…" />
        <EmptyState title="No questions yet" />
      </>
    );

    expect(screen.getAllByRole('status').map((el) => el.textContent)).toEqual([
      'Loading history…',
      'Analyzing your question…This can take a few seconds.'
    ]);
    expect(screen.getByText('No questions yet')).toBeInTheDocument();
  });

  test('PageHeader gives the page its one h1', () => {
    render(<PageHeader eyebrow="01" title="Question History" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Question History' })).toBeInTheDocument();
  });
});

describe('RateLimitNotice', () => {
  test('counts down the server wait, then lets the student retry by hand', () => {
    vi.useFakeTimers();
    try {
      const onRetry = vi.fn();
      render(<RateLimitNotice retryAfter={3} onRetry={onRetry} />);

      expect(screen.getByRole('status')).toHaveTextContent('Please wait about 3 seconds.');
      expect(screen.getByRole('button', { name: 'Try again' })).toBeDisabled();

      act(() => vi.advanceTimersByTime(3000));

      expect(screen.getByRole('status')).toHaveTextContent('You can try again now.');
      expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
      // Waiting out the timer never retries on its own
      expect(onRetry).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  test('without a known wait it asks for a minute and allows a manual retry', () => {
    render(<RateLimitNotice retryAfter={null} onRetry={() => {}} />);

    expect(screen.getByRole('status')).toHaveTextContent('Please wait a minute, then try again.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });
});

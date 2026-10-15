import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Logo, { LogoMark } from './Logo';

describe('Logo', () => {
  test('lockup spells the brand exactly and hides the decorative mark', () => {
    const { container } = render(<Logo />);

    expect(container).toHaveTextContent(/^Shikho English$/);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  test('standalone mark exposes an accessible name when titled', () => {
    render(<LogoMark title="Shikho English" />);

    expect(screen.getByRole('img', { name: 'Shikho English' })).toBeInTheDocument();
  });

  test('mono mark follows currentColor', () => {
    const { container } = render(<LogoMark tone="mono" />);

    expect(container.querySelector('path[mask]')).toHaveAttribute('fill', 'currentColor');
  });
});

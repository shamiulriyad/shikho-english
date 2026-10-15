import { describe, expect, test } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SiteFooter from './SiteFooter';
import { renderWithProviders, signIn } from '../test/utils';

const hrefs = (name: string) =>
  within(screen.getByRole('navigation', { name })).getAllByRole('link').map((link) => link.getAttribute('href'));

describe('SiteFooter', () => {
  test('Learn lists only pages that exist', () => {
    renderWithProviders(<SiteFooter />);

    expect(hrefs('Learn')).toEqual(['/', '/topics', '/analyze', '/practice', '/quiz', '/history', '/progress']);
  });

  test('a visitor can log in or create an account', () => {
    renderWithProviders(<SiteFooter />);

    expect(hrefs('Account')).toEqual(['/login', '/register']);
  });

  test('a student gets settings and can log out', async () => {
    signIn();
    renderWithProviders(<SiteFooter />, { route: '/progress' });

    const account = within(screen.getByRole('navigation', { name: 'Account' }));
    expect(account.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');

    await userEvent.click(account.getByRole('button', { name: 'Log out' }));

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('help points to the real FAQ on the homepage', () => {
    renderWithProviders(<SiteFooter />);

    expect(hrefs('Help')).toEqual(['/#faq']);
  });

  test('shows the tagline, the AI disclaimer and the current year', () => {
    renderWithProviders(<SiteFooter />);

    expect(screen.getByText('Understand English. Think clearly. Grow confidently.')).toBeInTheDocument();
    expect(screen.getByText(/AI-generated and can contain mistakes/)).toBeInTheDocument();
    expect(screen.getByText(`© ${new Date().getFullYear()} Shikho English`)).toBeInTheDocument();
  });

  test('invents no social, contact or legal links', () => {
    renderWithProviders(<SiteFooter />);

    const footer = screen.getByRole('contentinfo');
    for (const link of within(footer).getAllByRole('link')) {
      expect(link.getAttribute('href')).toMatch(/^\//);
    }
    expect(within(footer).queryByText(/privacy|terms|contact|facebook|twitter|instagram/i)).not.toBeInTheDocument();
  });

  test('the logo artwork is decorative and hidden from screen readers', () => {
    renderWithProviders(<SiteFooter />);

    const footer = screen.getByRole('contentinfo');
    expect(within(footer).queryByRole('img')).not.toBeInTheDocument();
    for (const svg of footer.querySelectorAll('svg')) {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    }
  });
});

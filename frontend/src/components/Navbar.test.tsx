import { describe, expect, test } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from './Navbar';
import { renderWithProviders, signIn } from '../test/utils';

const openMobileMenu = async () => {
  const toggle = screen.getByRole('button', { name: 'Open menu' });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(toggle);
  expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
  return within(document.getElementById('mobile-menu')!);
};

describe('Navbar', () => {
  test('shows the Shikho English brand', () => {
    renderWithProviders(<Navbar />);

    expect(screen.getByRole('link', { name: /shikho english/i })).toHaveAttribute('href', '/');
  });

  test('mobile menu is closed until the toggle is pressed', () => {
    renderWithProviders(<Navbar />);

    expect(document.getElementById('mobile-menu')).toBeNull();
  });

  test('mobile menu gives a logged-in student every link and logout', async () => {
    signIn();
    renderWithProviders(<Navbar />);

    const menu = await openMobileMenu();

    expect(menu.getByRole('link', { name: 'Analyze' })).toHaveAttribute('href', '/analyze');
    expect(menu.getByRole('link', { name: 'History' })).toHaveAttribute('href', '/history');
    expect(menu.getByRole('link', { name: 'Practice' })).toHaveAttribute('href', '/practice');
    expect(menu.getByRole('link', { name: 'Quiz' })).toHaveAttribute('href', '/quiz');
    expect(menu.getByRole('link', { name: 'Progress' })).toHaveAttribute('href', '/progress');
    expect(menu.getByText('Test Student')).toBeInTheDocument();
    expect(menu.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  test('mobile menu gives a visitor login and register', async () => {
    renderWithProviders(<Navbar />);

    const menu = await openMobileMenu();

    expect(menu.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
    expect(menu.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
  });

  test('choosing a mobile link navigates and closes the menu', async () => {
    signIn();
    renderWithProviders(<Navbar />);

    const menu = await openMobileMenu();
    await userEvent.click(menu.getByRole('link', { name: 'Quiz' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/quiz');
    expect(document.getElementById('mobile-menu')).toBeNull();
  });

  test('logout from the mobile menu signs out and returns home', async () => {
    signIn();
    renderWithProviders(<Navbar />, { route: '/practice' });

    const menu = await openMobileMenu();
    await userEvent.click(menu.getByRole('button', { name: 'Logout' }));

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
    expect(localStorage.getItem('token')).toBeNull();
    expect(document.getElementById('mobile-menu')).toBeNull();
    // Logged-out links are back
    expect(screen.getAllByRole('link', { name: 'Login' }).length).toBeGreaterThan(0);
  });
});

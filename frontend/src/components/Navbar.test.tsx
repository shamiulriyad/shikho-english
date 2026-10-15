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
    expect(menu.getByRole('link', { name: 'Sentence Check' })).toHaveAttribute('href', '/practice');
    expect(menu.getByRole('link', { name: 'Quiz' })).toHaveAttribute('href', '/quiz');
    expect(menu.getByRole('link', { name: 'Progress' })).toHaveAttribute('href', '/progress');
    expect(menu.getByRole('link', { name: 'Topics' })).toHaveAttribute('href', '/topics');
    expect(menu.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
    expect(menu.getByText('Test Student')).toBeInTheDocument();
    expect(menu.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  test('mobile menu gives a visitor home, topics, log in and get started', async () => {
    renderWithProviders(<Navbar />);

    const menu = await openMobileMenu();

    expect(menu.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(menu.getByRole('link', { name: 'Topics' })).toHaveAttribute('href', '/topics');
    expect(menu.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(menu.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/register');
    expect(menu.queryByRole('link', { name: 'Analyze' })).not.toBeInTheDocument();
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
    await userEvent.click(menu.getByRole('button', { name: 'Log out' }));

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
    expect(localStorage.getItem('token')).toBeNull();
    expect(document.getElementById('mobile-menu')).toBeNull();
    // Logged-out actions are back
    expect(screen.getAllByRole('link', { name: 'Log in' }).length).toBeGreaterThan(0);
  });

  test('Escape closes the mobile menu and returns focus to its button', async () => {
    renderWithProviders(<Navbar />);

    await openMobileMenu();
    await userEvent.keyboard('{Escape}');

    expect(document.getElementById('mobile-menu')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus();
  });

  test('marks the current page in the navigation', () => {
    signIn();
    renderWithProviders(<Navbar />, { route: '/history' });

    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'History' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Analyze' })).not.toHaveAttribute('aria-current');
  });

  test('offers a skip link to the main content', () => {
    renderWithProviders(<Navbar />);

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main-content');
  });

  test('a visitor sees Home, Topics, Log in and Get started on desktop', () => {
    renderWithProviders(<Navbar />, { route: '/topics' });

    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual(['Home', 'Topics']);
    expect(within(nav).getByRole('link', { name: 'Topics' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    expect(screen.getAllByRole('link', { name: 'Get started' })[0]).toHaveAttribute('href', '/register');
  });

  test('the account menu closes with Escape and returns focus to its button', async () => {
    signIn();
    renderWithProviders(<Navbar />);

    const button = screen.getByRole('button', { name: 'Account menu for Test Student' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(within(document.getElementById('account-menu')!).getByText('student@example.com')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    expect(document.getElementById('account-menu')).toBeNull();
    expect(button).toHaveFocus();
  });

  test('the account menu closes when clicking elsewhere', async () => {
    signIn();
    renderWithProviders(<Navbar />);

    await userEvent.click(screen.getByRole('button', { name: 'Account menu for Test Student' }));
    await userEvent.click(document.body);

    expect(document.getElementById('account-menu')).toBeNull();
  });
});

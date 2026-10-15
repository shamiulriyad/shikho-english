import { describe, expect, test } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { jsonResponse, mockFetch, problemResponse, renderWithProviders, testUser } from '../test/utils';

const fillLogin = async () => {
  await userEvent.type(screen.getByLabelText('Email'), 'student@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'secret123');
};

describe('LoginForm', () => {
  test('stores the session and goes to analyze after a successful login', async () => {
    const fetchMock = mockFetch(jsonResponse({ success: true, message: 'Login successful', token: 'new-token', user: testUser }));
    renderWithProviders(<LoginForm />, { route: '/login' });

    await fillLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/analyze'));
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(testUser);
    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({ email: 'student@example.com', password: 'secret123' });
  });

  test('returns to the page that sent the student to login', async () => {
    mockFetch(jsonResponse({ success: true, message: 'Login successful', token: 'new-token', user: testUser }));
    renderWithProviders(<LoginForm />, { route: '/login?next=%2Fhistory%3Fpage%3D2' });

    await fillLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/history$/));
  });

  test.each(['https://evil.example/steal', '//evil.example', '/\\evil.example', '/login'])(
    'ignores an unsafe return address (%s) and goes to analyze',
    async (next) => {
      mockFetch(jsonResponse({ success: true, message: 'Login successful', token: 'new-token', user: testUser }));
      renderWithProviders(<LoginForm />, { route: `/login?next=${encodeURIComponent(next)}` });

      await fillLogin();
      await userEvent.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/analyze$/));
    }
  );

  test('keeps the return address on the link to register', () => {
    renderWithProviders(<LoginForm />, { route: '/login?next=%2Fprogress' });

    expect(screen.getByRole('link', { name: 'Register here' })).toHaveAttribute('href', '/register?next=%2Fprogress');
  });

  test('shows the server message when credentials are wrong', async () => {
    mockFetch(problemResponse(401, 'Invalid email or password', 'Unauthorized'));
    renderWithProviders(<LoginForm />, { route: '/login' });

    await fillLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('RegisterForm', () => {
  test('shows the server message when the email is taken', async () => {
    mockFetch(problemResponse(400, 'Email already exists', 'Bad Request'));
    renderWithProviders(<RegisterForm />, { route: '/register' });

    await userEvent.type(screen.getByLabelText('Full Name'), 'Test Student');
    await userEvent.type(screen.getByLabelText('Email'), 'student@example.com');
    await userEvent.type(screen.getByLabelText('Username'), 'student');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Email already exists')).toBeInTheDocument();
  });

  test('registers and goes to analyze', async () => {
    const fetchMock = mockFetch(jsonResponse({ success: true, message: 'Registration successful', token: 'new-token', user: testUser }));
    renderWithProviders(<RegisterForm />, { route: '/register' });

    await userEvent.type(screen.getByLabelText('Full Name'), 'Test Student');
    await userEvent.type(screen.getByLabelText('Email'), 'student@example.com');
    await userEvent.type(screen.getByLabelText('Username'), 'student');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/analyze$/));
    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({
      email: 'student@example.com',
      username: 'student',
      password: 'secret123',
      fullName: 'Test Student'
    });
  });

  test('states the server minimums next to the fields', () => {
    renderWithProviders(<RegisterForm />, { route: '/register' });

    expect(screen.getByLabelText('Username')).toHaveAccessibleDescription('At least 4 characters.');
    expect(screen.getByLabelText('Username')).toHaveAttribute('minLength', '4');
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('At least 6 characters.');
    expect(screen.getByLabelText('Password')).toHaveAttribute('autoComplete', 'new-password');
  });
});

import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { jsonResponse, mockFetch, problemResponse, renderWithProviders, testUser } from '../test/utils';

const fillLogin = async () => {
  await userEvent.type(screen.getByLabelText('Email'), 'student@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'secret123');
};

describe('LoginForm', () => {
  test('stores the session and goes to practice after a successful login', async () => {
    const fetchMock = mockFetch(jsonResponse({ success: true, message: 'Login successful', token: 'new-token', user: testUser }));
    renderWithProviders(<LoginForm />, { route: '/login' });

    await fillLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByTestId('location')).toHaveTextContent('/practice');
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(testUser);
    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({ email: 'student@example.com', password: 'secret123' });
  });

  test('shows the server message when credentials are wrong', async () => {
    mockFetch(problemResponse(401, 'Invalid email or password', 'Unauthorized'));
    renderWithProviders(<LoginForm />, { route: '/login' });

    await fillLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
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
});

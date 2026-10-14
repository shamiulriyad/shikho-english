import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PracticeProvider } from './context/PracticeContext';

test('renders the home page for a logged-out visitor', () => {
  render(
    <AuthProvider>
      <PracticeProvider>
        <App />
      </PracticeProvider>
    </AuthProvider>
  );

  expect(screen.getByText(/master english grammar with ai/i)).toBeInTheDocument();
  expect(screen.getByText(/register now/i)).toBeInTheDocument();
});

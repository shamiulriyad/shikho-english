import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AFTER_LOGIN, safeReturnTo, withReturnTo } from '../utils/returnTo';
import AuthLayout from './AuthLayout';
import Alert from './ui/Alert';
import { Button } from './ui/Button';
import { Input } from './ui/Field';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Set when a protected page or an expired session sent the student here
  const returnTo = safeReturnTo(searchParams.get('next'));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate(returnTo ?? DEFAULT_AFTER_LOGIN, { replace: true });
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <AuthLayout
      title="Login"
      intro={returnTo ? 'Log in to continue where you left off.' : 'Welcome back. Log in to keep practising.'}
      footer={
        <>
          Don't have an account?{' '}
          <Link to={withReturnTo('/register', returnTo)} className="font-semibold text-brand-forest underline underline-offset-4">
            Register here
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}

        <Input
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" fullWidth size="lg" loading={isLoading} loadingText="Logging in…">
          Login
        </Button>
      </form>
    </AuthLayout>
  );
};

export default LoginForm;

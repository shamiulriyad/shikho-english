import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AFTER_LOGIN, safeReturnTo, withReturnTo } from '../utils/returnTo';
import AuthLayout from './AuthLayout';
import Alert from './ui/Alert';
import { Button } from './ui/Button';
import { Input } from './ui/Field';

// Same minimums as the backend's UserRegisterDto, so most problems are caught before sending
const MIN_USERNAME_LENGTH = 4;
const MIN_PASSWORD_LENGTH = 6;

const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Set when a protected page or an expired session sent the student here
  const returnTo = safeReturnTo(searchParams.get('next'));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await register(email, username, password, fullName);
    if (result.success) {
      navigate(returnTo ?? DEFAULT_AFTER_LOGIN, { replace: true });
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <AuthLayout
      title="Register"
      intro="Create an account to analyse questions, practise and track your progress."
      footer={
        <>
          Already have an account?{' '}
          <Link to={withReturnTo('/login', returnTo)} className="font-semibold text-brand-forest underline underline-offset-4">
            Login here
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}

        <Input
          id="register-full-name"
          label="Full Name"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="register-username"
          label="Username"
          hint={`At least ${MIN_USERNAME_LENGTH} characters.`}
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={MIN_USERNAME_LENGTH}
        />
        <Input
          id="register-password"
          label="Password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={MIN_PASSWORD_LENGTH}
        />

        <Button type="submit" variant="accent" fullWidth size="lg" loading={isLoading} loadingText="Registering…">
          Register
        </Button>
      </form>
    </AuthLayout>
  );
};

export default RegisterForm;

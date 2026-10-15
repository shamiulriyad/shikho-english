import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AFTER_LOGIN, safeReturnTo } from '../utils/returnTo';
import LoginForm from '../components/LoginForm';

const LoginPage = () => {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();

  // Already signed in: skip the form and go where the student was heading
  if (user && token) {
    return <Navigate to={safeReturnTo(searchParams.get('next')) ?? DEFAULT_AFTER_LOGIN} replace />;
  }
  return <LoginForm />;
};

export default LoginPage;

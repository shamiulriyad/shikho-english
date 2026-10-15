import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AFTER_LOGIN, safeReturnTo } from '../utils/returnTo';
import RegisterForm from '../components/RegisterForm';

const RegisterPage = () => {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();

  // Already signed in: there is nothing to register
  if (user && token) {
    return <Navigate to={safeReturnTo(searchParams.get('next')) ?? DEFAULT_AFTER_LOGIN} replace />;
  }
  return <RegisterForm />;
};

export default RegisterPage;

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginPath } from '../utils/returnTo';

/** Pages also sit behind <RequireAuth>; this keeps them safe when rendered on their own. */
export const useRequireAuth = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (!token || !user) {
      navigate(loginPath(pathname + search + hash), { replace: true });
    }
  }, [token, user, navigate, pathname, search, hash]);

  return { user, token };
};

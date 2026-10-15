import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginPath } from '../utils/returnTo';

/**
 * Layout route for pages that need a signed-in student. Signed-out visitors go to login
 * before the page renders (no flash of protected content) and come back here afterwards.
 */
const RequireAuth = () => {
  const { user, token } = useAuth();
  const { pathname, search, hash } = useLocation();

  if (!user || !token) {
    return <Navigate to={loginPath(pathname + search + hash)} replace />;
  }
  return <Outlet />;
};

export default RequireAuth;

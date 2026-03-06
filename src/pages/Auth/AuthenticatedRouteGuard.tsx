import React, { ReactElement } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { LoaderFull } from '@/components/LoaderFull';
import { useAuthContext } from '@/services/auth/AuthContext';

interface AuthenticatedRouteGuardProps {
  children: ReactElement;
}

const AuthenticatedRouteGuard: React.FC<AuthenticatedRouteGuardProps> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return <LoaderFull />;
  }

  if (!isAuthenticated) {
    const redirect =
      !location.pathname || ['/', '/logout'].includes(location.pathname)
        ? '/login'
        : `/login?redirect=${location.pathname}`;
    // Redirect unauthenticated users to the login page, preserving the attempted location
    return <Navigate to={redirect} state={{ from: location }} replace />;
  }

  return children;
};

export default AuthenticatedRouteGuard;

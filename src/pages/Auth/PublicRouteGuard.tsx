import React, { ReactElement } from 'react';

import { Navigate, useSearchParams } from 'react-router-dom';

import { LoaderFull } from '@/components/LoaderFull';
import { useAuthContext } from '@/services/auth/AuthContext';

interface PublicRouteGuardProps {
  children: ReactElement;
}

const PublicRouteGuard: React.FC<PublicRouteGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const [searchParams] = useSearchParams();

  if (isLoading) {
    return <LoaderFull />;
  }

  if (isAuthenticated) {
    const redirect = searchParams.get('redirect') || '/';
    // Redirect authenticated users to the home/dashboard page
    return <Navigate to={redirect} replace />;
  }

  return children;
};

export default PublicRouteGuard;

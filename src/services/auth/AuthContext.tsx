// src/services/auth/AuthContext.tsx

import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useIsHydrated } from '@/hooks/useIsHydrated';

/* =====================================================
   Types
===================================================== */

type AuthContextValue = {
  isAuthenticated: boolean;
  updateToken: (token?: string | null) => void;
  logout: () => void;
};

export const AUTH_TOKEN_KEY = 'authToken';

/* =====================================================
   Create Context
===================================================== */

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

/* =====================================================
   Hook
===================================================== */

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuthContext must be used inside <AuthProvider>'
    );
  }

  const isHydrated = useIsHydrated();

  return {
    isLoading: !isHydrated,
    ...context,
  };
};

/* =====================================================
   Provider
===================================================== */

export const AuthProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  });

  /* ================= Update Token ================= */

  const updateToken = useCallback((newToken?: string | null) => {
    if (!newToken) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
    } else {
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
      setToken(newToken);
    }
  }, []);

  /* ================= Logout ================= */

  const logout = useCallback(() => {
    updateToken(null);
  }, [updateToken]);

  /* ================= Listen for 401 Event ================= */

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener(
        'unauthorized',
        handleUnauthorized
      );
    };
  }, [logout]);

  /* ================= Context Value ================= */

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!token,
      updateToken,
      logout,
    }),
    [token, updateToken, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
import Axios, { AxiosResponse } from 'axios';

import { AUTH_TOKEN_KEY, useAuthContext } from '@/services/auth/AuthContext';

Axios.interceptors.request.use(
  (config) => {
    const isExternal = !!config.url?.startsWith('http');
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!isExternal && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.baseURL = import.meta.env.VITE_PUBLIC_API_URL || 'https://yestechnik-api.numerique360.com/';

    return config;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log('Unauthorized');
      useAuthContext().logout();
      // navigate('/login');
    }
    return Promise.reject(error);
  }
);

Axios.interceptors.response.use((response: AxiosResponse) => {
  return response;
});

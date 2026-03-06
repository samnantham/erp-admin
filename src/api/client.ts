import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
} from 'axios';
import { z } from 'zod';
import { AUTH_TOKEN_KEY } from '@/services/auth/AuthContext';

/* ================= Axios Instance ================= */

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ================= Request Interceptor ================= */

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================= Response Interceptor ================= */

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('unauthorized'));
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';

    return Promise.reject(new Error(message));
  }
);

/* ================= Generic Request Wrapper ================= */

const parseWithSchema = <T>(
  data: unknown,
  schema: z.ZodType<T>
): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    console.error('Zod validation error:', result.error);
    throw new Error('Invalid server response');
  }

  return result.data;
};

/* ================= GET ================= */

export const getRequest = async <T>(
  url: string,
  schema: z.ZodType<T>,
  queryParams?: Record<string, any>
): Promise<T> => {
  const params = new URLSearchParams();

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
  }

  const finalUrl = params.toString()
    ? `${url}?${params.toString()}`
    : url;

  const response = await apiClient.get(finalUrl);

  return schema.parse(response.data);
};

/* ================= POST ================= */

export const postRequest = async <T, V>(
  url: string,
  body: V,
  schema: z.ZodType<T>
): Promise<T> => {
  const { data } = await apiClient.post(url, body);
  return parseWithSchema(data, schema);
};

/* ================= PUT ================= */

export const putRequest = async <T, V>(
  url: string,
  body: V,
  schema: z.ZodType<T>
): Promise<T> => {
  const { data } = await apiClient.put(url, body);
  return parseWithSchema(data, schema);
};

/* ================= DELETE ================= */

export const deleteRequest = async <T>(
  url: string,
  schema: z.ZodType<T>
): Promise<T> => {
  const { data } = await apiClient.delete(url);
  return parseWithSchema(data, schema);
};
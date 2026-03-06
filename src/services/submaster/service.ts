import Axios, { AxiosError } from 'axios';
import {
  QueryKey,
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from 'react-query';

interface QueryParams {
  status?: string;
}

export type ApiResp = { status: boolean; message?: string; errors?: Record<string, string[]> };
export type Vars = { url: string; deleted_reason?: string };
export const endPoints = import.meta.env.VITE_API_ENDPOINTS ? JSON.parse(import.meta.env.VITE_API_ENDPOINTS) : {};


export const fetchData = async (
  url: string,
  parser: TODO,
  queryParams: QueryParams = {}
) => {
  const queryString = new URLSearchParams();

  Object.entries(queryParams).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        if (nestedValue !== undefined && nestedValue !== null) {
          queryString.append(`search[${nestedKey}]`, nestedValue.toString());
        }
      });
    } else {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    }
  });
  try {
    const response = await Axios.get(`${url}?${queryString}`);
    return parser().parse(response.data);
  } catch (error) {
    console.log(error);
    throw new Error(`Failed to fetch data from ${url}.`);
  }
};

export type SubMasterMutationConfig<T, Variables> = UseMutationOptions<
  T,
  AxiosError<T>,
  Variables
>;

export const useSubMasterMutation = <T, Variables>(
  endpoint: string,
  parseResponse: (data: TODO) => T,
  config: SubMasterMutationConfig<T, Variables>
) => {
  return useMutation(
    async (variables: Variables) => {
      const response = await Axios.post(endpoint, variables);
      return parseResponse(response.data);
    },
    {
      ...config,
      onSuccess: (data, ...args) => {
        config?.onSuccess?.(data, ...args);
      },
    }
  );
};

export const useSubMasterPutMutation = <T, Variables>(
  endpoint: (variables: Variables) => string,
  parseResponse: (data: TODO) => T,
  config: SubMasterMutationConfig<T, Variables>
) => {
  return useMutation(
    async (variables: Variables) => {
      const url = endpoint(variables);
      const response = await Axios.put(url, variables);
      return parseResponse(response.data);
    },
    {
      ...config,
      onSuccess: (data, ...args) => {
        config?.onSuccess?.(data, ...args);
      },
    }
  );
};

export const useSubMasterPostMutation = <T, Variables>(
  endpoint: (variables: Variables) => string,
  parseResponse: (data: TODO) => T,
  config: SubMasterMutationConfig<T, Variables>
) => {
  return useMutation(
    async (variables: Variables) => {
      const url = endpoint(variables);
      const response = await Axios.post(url, variables);
      return parseResponse(response.data);
    },
    {
      ...config,
      onSuccess: (data, ...args) => {
        config?.onSuccess?.(data, ...args);
      },
    }
  );
};

export const useDeleteMutation = <T, Variables>(
  endpoint: (variables: Variables) => string,
  parseResponse: (data: any) => T,
  config: UseMutationOptions<T, AxiosError<T>, Variables> = {}
) => {
  return useMutation<T, AxiosError<T>, Variables>(
    async (variables: Variables) => {
      const url = endpoint(variables);
      // 👇 send variables as the body of the DELETE request
      const res = await Axios.delete(url, { data: variables });
      return parseResponse(res.data);
    },
    config
  );
};

export type DeleteRequest = {
  url: string;
  method?: 'DELETE' | 'POST';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
};

export type UseDeleteOptions<TResp, TVars> = {
  request: (vars: TVars) => DeleteRequest;
  invalidate?: QueryKey[];
  parser?: (data: unknown) => TResp;
} & Omit<UseMutationOptions<TResp, unknown, TVars, unknown>, 'mutationFn'>;

export function useDelete<TResp = any, TVars = any>(options: UseDeleteOptions<TResp, TVars>) {
  const { request, invalidate, parser, ...rest } = options;
  const queryClient = useQueryClient();

  return useMutation<TResp, unknown, TVars>({
    mutationFn: async (vars: TVars) => {
      const { url, method = 'DELETE', body, query, headers } = request(vars);

      try {
        const res = await Axios({
          url,
          method,
          headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
          data: body,
          params: query,
        });
        return parser ? parser(res.data) : (res.data as TResp);
      } catch (e) {
        const err = e as AxiosError<any>;
        // normalize the error so caller can use `error.data.message`
        const normalized = new Error(
          err.response?.data?.message || err.message || 'Request failed'
        ) as any;
        normalized.status = err.response?.status;
        normalized.data = err.response?.data;
        throw normalized;
      }
    },
    onSuccess: (data, vars, ctx) => {
      // default invalidations
      for (const key of invalidate ?? []) queryClient.invalidateQueries(key);
      rest.onSuccess?.(data, vars, ctx);
    },
    ...rest,
  });
}


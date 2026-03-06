import { UseQueryOptions, useQuery, useQueryClient } from 'react-query';
import Axios from 'axios';

import { z } from 'zod';
import {
  CreatePayload,
  IndexPayload,
  ListPayload,
  zCreatePayload,
  zIndexPayload,
  zListPayload,
} from '../schema';
import {
  SubMasterMutationConfig,
  fetchData,
  useSubMasterMutation,
  useSubMasterPutMutation,
} from '../service';

const endPoints = import.meta.env.VITE_API_ENDPOINTS ? JSON.parse(import.meta.env.VITE_API_ENDPOINTS) : {};

type UseCustomerGroupListQueryOptions = UseQueryOptions<ListPayload>;
type UseCustomerGroupIndexQueryOptions = UseQueryOptions<IndexPayload>;

interface QueryParams {
  customer_type?: 'suppliers' | 'customers' | 'freight';
  group_id?: number;
}

const buildQueryString = (queryParams: QueryParams = {}) => {
  const qs = new URLSearchParams();

  Object.entries(queryParams).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      Object.entries(value as Record<string, unknown>).forEach(
        ([nestedKey, nestedVal]) => {
          if (nestedVal !== undefined && nestedVal !== null) {
            qs.append(`search[${nestedKey}]`, String(nestedVal));
          }
        }
      );
    } else if (value !== undefined && value !== null) {
      qs.append(key, String(value));
    }
  });

  return qs.toString();
};


const fetchAPIData = async <T>(
  url: string,
  schema: z.ZodType<T>,
  queryParams?: QueryParams
): Promise<T> => {
  const qs = buildQueryString(queryParams);
  const finalUrl = qs ? `${url}?${qs}` : url;

  try {
    const response = await Axios.get(finalUrl);
    return schema.parse(response.data);
  } catch (error) {
    console.error('API call failed', error);
    throw new Error(`Failed to fetch data from ${url}.`);
  }
};

export const useCustomerGroupList = (
  queryParams?: QueryParams,
  queryOptions: UseCustomerGroupListQueryOptions = {}
) =>
   useQuery({
      queryKey: ['CustomerIndexByUrl', endPoints.list.customer_group, queryParams],
      queryFn: () => fetchAPIData(endPoints.list.customer_group, zListPayload(), queryParams),
      retry: 2,
      refetchOnWindowFocus: false,
      enabled: !!endPoints.list.customer_group,
      ...queryOptions,
    });

export const useCustomerGroupIndex = (
  queryOptions: UseCustomerGroupIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: 'customerGroupIndex',
    queryFn: () => fetchData( endPoints.index.customer_group, zIndexPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
    onError: (error) => {
      console.error('Error fetching bin location list:', error);
      queryOptions.onError?.(error);
    },
  });

export const useCreateCustomerGroup = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();
  return useSubMasterMutation( endPoints.create.customer_group, zCreatePayload().parse, {
    ...config,
    onSuccess: (data, ...args) => {
      if (data.status) {
        queryClient.invalidateQueries('customerGroupList');
        queryClient.invalidateQueries('customerGroupIndex');
        config?.onSuccess?.(data, ...args);
      }
    },
  });
};

interface UpdateCustomerGroupVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateCustomerGroup = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateCustomerGroupVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateCustomerGroupVariables>(
    ({ id }) => endPoints.update.customer_group.replace(":id", id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          queryClient.invalidateQueries('customerGroupList');
          queryClient.invalidateQueries('customerGroupIndex');
          config?.onSuccess?.(data, ...args);
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

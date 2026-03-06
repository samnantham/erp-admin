import { UseQueryOptions, useQuery, useQueryClient } from 'react-query';

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

type UseCustomerStatusListQueryOptions = UseQueryOptions<ListPayload>;
type UseCustomerStatusIndexQueryOptions = UseQueryOptions<IndexPayload>;

export const useCustomerStatusList = (
  queryOptions: UseCustomerStatusListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'customerStatusList',
    queryFn: () => fetchData( endPoints.list.customer_status , zListPayload),
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

export const useCustomerStatusIndex = (
  queryOptions: UseCustomerStatusIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: 'customerStatusIndex',
    queryFn: () => fetchData( endPoints.index.customer_status, zIndexPayload),
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

export const useCreateCustomerStatus = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();
  return useSubMasterMutation( endPoints.create.customer_status, zCreatePayload().parse, {
    ...config,
    onSuccess: (data, ...args) => {
      if (data.status) {
        queryClient.invalidateQueries('customerStatusList');
        queryClient.invalidateQueries('customerStatusIndex');
        config?.onSuccess?.(data, ...args);
      }
    },
  });
};

interface UpdateCustomerStatusVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateCustomerStatus = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateCustomerStatusVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateCustomerStatusVariables>(
    ({ id }) => endPoints.update.customer_status.replace(":id", id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          queryClient.invalidateQueries('customerStatusList');
          queryClient.invalidateQueries('customerStatusIndex');
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

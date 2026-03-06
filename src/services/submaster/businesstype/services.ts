import { UseQueryOptions, useQuery, useQueryClient } from 'react-query';

import {
  CreatePayload,
  IndexPayload,
  ListPayload,
  zCreatePayload,
  zIndexPayload,
  zListPayload,
  QueryParams
} from '../schema';
import {
  SubMasterMutationConfig,
  fetchData,
  useSubMasterMutation,
  useSubMasterPutMutation,
} from '../service';

const endPoints = import.meta.env.VITE_API_ENDPOINTS ? JSON.parse(import.meta.env.VITE_API_ENDPOINTS) : {};

type UseBusinessTypeListQueryOptions = UseQueryOptions<ListPayload>;
type UseBusinessTypeIndexQueryOptions = UseQueryOptions<IndexPayload>;

export const useBusinessTypeList = (
  queryOptions: UseBusinessTypeListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'businessTypeList',
    queryFn: () => fetchData(endPoints.list.business_type, zListPayload),
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

  export const useBusinessTypeIndex = (
    queryParams?: QueryParams,
    queryOptions: UseBusinessTypeIndexQueryOptions = {}
  ) =>
    useQuery({
      queryKey: ['binLocationIndex', queryParams],
      queryFn: () =>
        fetchData(endPoints.index.business_type, zIndexPayload, queryParams),
      ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
    onError: (error) => {
      console.error('Error fetching bin location index:', error);
      queryOptions.onError?.(error);
    },
  });

export const useCreateBusinessType = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(endPoints.create.business_type, zCreatePayload().parse, {
    ...config,
    onSuccess: (data, ...args) => {
      if (data.status) {
        queryClient.invalidateQueries('businessTypeList');
        queryClient.invalidateQueries('businessTypeIndex');
        config?.onSuccess?.(data, ...args);
      }
    },
  });
};

interface UpdateBusinessTypeVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateBusinessType = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateBusinessTypeVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateBusinessTypeVariables>(
    ({ id }) => endPoints.update.business_type.replace(":id", id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          queryClient.invalidateQueries('businessTypeList');
          queryClient.invalidateQueries('businessTypeIndex');
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

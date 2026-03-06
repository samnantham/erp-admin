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

type UseListQueryOptions = UseQueryOptions<ListPayload>;
type UseIndexQueryOptions = UseQueryOptions<IndexPayload>;

export const useList = (queryOptions: UseListQueryOptions = {}) =>
  useQuery({
    queryKey: 'conditionList',
    queryFn: () => fetchData( endPoints.list.condition, zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

  export const useIndex = (
    queryParams?: QueryParams,
    queryOptions: UseIndexQueryOptions = {}
  ) =>
    useQuery({
      queryKey: ['conditionIndex', queryParams],
      queryFn: () =>
        fetchData(endPoints.index.condition, zIndexPayload, queryParams),
      ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useCreate = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();
  return useSubMasterMutation(endPoints.create.condition, zCreatePayload().parse, {
    ...config,
    onSuccess: (data, ...args) => {
      if (data.status) {
        queryClient.invalidateQueries('conditionList');
        queryClient.invalidateQueries('conditionIndex');
        config?.onSuccess?.(data, ...args);
      }
    },
  });
};

interface UpdateVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdate = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateVariables>(
    ({ id }) => endPoints.update.condition.replace(":id",id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          queryClient.invalidateQueries('conditionList');
          queryClient.invalidateQueries('conditionIndex');
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

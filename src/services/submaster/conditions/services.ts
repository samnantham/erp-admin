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

type UseConditionListQueryOptions = UseQueryOptions<ListPayload>;
type UseConditionIndexQueryOptions = UseQueryOptions<IndexPayload>;

export const useConditionList = (
  queryOptions: UseConditionListQueryOptions = {}
) =>
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
    queryOptions: UseConditionIndexQueryOptions = {}
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

export const useConditionClass = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation( endPoints.create.condition, zCreatePayload().parse, {
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

interface UpdateConditionVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateCondition = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateConditionVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateConditionVariables>(
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

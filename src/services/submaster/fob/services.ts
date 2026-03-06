import { UseQueryOptions, useQuery, useQueryClient } from 'react-query';

import {
  CreatePayload,
  IndexPayload,
  ListPayload,
  QueryParams,
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

import { endPoints } from '@/services/submaster/service';

type UseFOBListQueryOptions = UseQueryOptions<ListPayload>;
type UseFOBIndexQueryOptions = UseQueryOptions<IndexPayload>;

export const useFOBList = (queryOptions: UseFOBListQueryOptions = {}) =>
  useQuery({
    queryKey: 'fobList',
    queryFn: () => fetchData(endPoints.list.fob, zListPayload),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

export const useFOBIndex = (
  queryParams?: QueryParams,
  queryOptions: UseFOBIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: ['fobIndex', queryParams],
    queryFn: () => fetchData(endPoints.index.fob, zIndexPayload, queryParams),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useCreateFOB = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(endPoints.create.fob, zCreatePayload().parse, {
    ...config,
    onSuccess: (data, ...args) => {
      if (data.status) {
        config?.onSuccess?.(data, ...args);
      }
    },
    // Add invalidation for related queries
    onSettled: () => {
      queryClient.invalidateQueries('fobList');
      queryClient.invalidateQueries('fobIndex');
    },
  });
};

interface UpdateFOBVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateFOB = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateFOBVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateFOBVariables>(
    ({ id }) => endPoints.update.fob.replace(':id', id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
      // Add invalidation for related queries
      onSettled: () => {
        queryClient.invalidateQueries('fobList');
        queryClient.invalidateQueries('fobIndex');
      },
    }
  );
};

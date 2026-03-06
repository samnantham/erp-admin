import { UseQueryOptions, useQuery, useQueryClient } from 'react-query';

import {
  CreatePayload,
  ListPayload,
  PriorityIndexPayload,
  QueryParams,
  zCreatePayload,
  zListPayload,
  zPriorityDetailsPayload,
  zPriorityIndexPayload,
} from '../schema';
import {
  SubMasterMutationConfig,
  fetchData,
  useSubMasterMutation,
  useSubMasterPutMutation,
} from '../service';

import { endPoints } from '@/services/submaster/service';

type UsePriorityListQueryOptions = UseQueryOptions<ListPayload>;
type UsePriorityIndexQueryOptions = UseQueryOptions<PriorityIndexPayload>;

export const usePriorityList = (
  queryOptions: UsePriorityListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'priorityList',
    queryFn: () => fetchData(endPoints.list.priority, zListPayload),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

export const usePriorityIndex = (
  queryParams?: QueryParams,
  queryOptions: UsePriorityIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: ['priorityIndex', queryParams],
    queryFn: () =>
      fetchData(endPoints.index.priority, zPriorityIndexPayload, queryParams),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const fetchPriorityInfo = () => {
  const queryClient = useQueryClient();

  return async (id: number | string) => {
    if (!id || id === 0 || id === '0') return null;

    return queryClient.fetchQuery({
      queryKey: ['priorityDetails', id],
      queryFn: () =>
        fetchData(
          endPoints.info.priority.replace(':id', id),
          zPriorityDetailsPayload
        ),
    });
  };
};

export const usePriorityCreate = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(
    endPoints.create.priority,
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('priorityList');
          queryClient.invalidateQueries('priorityIndex');
        }
      },
    }
  );
};

interface UpdatePriorityVariables {
  id: number; // Assuming id is a number
  name: string;
  days: number;
}

export const useUpdatePriority = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdatePriorityVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdatePriorityVariables>(
    ({ id }) => endPoints.update.priority.replace(':id', id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('priorityList');
          queryClient.invalidateQueries('priorityIndex');
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

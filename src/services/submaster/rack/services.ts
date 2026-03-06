import { UseQueryOptions, useQuery, useQueryClient } from 'react-query';

import {
  CreatePayload,
  ListPayload,
  QueryParams,
  zCreatePayload,
  zListPayload,
} from '../schema';
import {
  SubMasterMutationConfig,
  fetchData,
  useSubMasterMutation,
  useSubMasterPutMutation,
} from '../service';
import { RackIndexPayload, zRackIndexPayload } from './schema';

import { endPoints } from '@/services/submaster/service';

type UseRackListQueryOptions = UseQueryOptions<ListPayload>;
type UseRackIndexQueryOptions = UseQueryOptions<RackIndexPayload>;

export const useRackList = (queryOptions: UseRackListQueryOptions = {}) =>
  useQuery({
    queryKey: 'rackList',
    queryFn: () => fetchData(endPoints.list.rack, zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useRackIndex = (
  queryParams?: QueryParams,
  queryOptions: UseRackIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: ['rackIndex', queryParams],
    queryFn: () =>
      fetchData(endPoints.index.rack, zRackIndexPayload, queryParams),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useCreateRack = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
      is_quarantine: boolean;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(endPoints.create.rack, zCreatePayload().parse, {
    ...config,
    onSuccess: (data, ...args) => {
      if (data.status) {
        config?.onSuccess?.(data, ...args);
        queryClient.invalidateQueries('rackIndex');
        queryClient.invalidateQueries('rackList');
      }
    },
  });
};

interface UpdateRackVariables {
  id: number; // Assuming id is a number
  name: string;
  is_quarantine: boolean;
}

export const useUpdateRack = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateRackVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateRackVariables>(
    ({ id }) => endPoints.update.rack.replace(':id', id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('rackIndex');
          queryClient.invalidateQueries('rackList');
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

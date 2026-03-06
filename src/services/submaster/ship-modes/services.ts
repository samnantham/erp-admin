import { UseQueryOptions, useQuery, useQueryClient } from 'react-query';

import {
  CreatePayload,
  IndexPayload,
  ListPayload,
  QueryParams,
  zCreatePayload,
  zIndexPayload,
  zListPayload
} from '../schema';
import {
  SubMasterMutationConfig,
  fetchData,
  useSubMasterMutation,
  useSubMasterPutMutation,
} from '../service';

import { endPoints } from '@/services/submaster/service';

type UseShipModesListQueryOptions = UseQueryOptions<ListPayload>;
type UseShipModesIndexQueryOptions = UseQueryOptions<IndexPayload>;

export const useShipModesList = (
  queryOptions: UseShipModesListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'shipModesList',
    queryFn: () => fetchData(endPoints.list.ship_mode, zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useShipModesIndex = (
  queryParams?: QueryParams,
  queryOptions: UseShipModesIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: ['shipModesIndex', queryParams],
    queryFn: () =>
      fetchData(endPoints.index.ship_mode, zIndexPayload, queryParams),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useCreateShipModes = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(
    endPoints.create.ship_mode,
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('shipModesIndex');
          queryClient.invalidateQueries('shipModesList');
        }
      },
    }
  );
};

interface UpdateShipModesVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateShipModes = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateShipModesVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateShipModesVariables>(
    ({ id }) => endPoints.update.ship_mode.replace(':id', id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('shipModesIndex');
          queryClient.invalidateQueries('shipModesList');
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

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

type UseShipTypesListQueryOptions = UseQueryOptions<ListPayload>;
type UseShipTypesIndexQueryOptions = UseQueryOptions<IndexPayload>;

export const useShipTypesList = (
  queryOptions: UseShipTypesListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'shipTypesList',
    queryFn: () => fetchData(endPoints.list.ship_type, zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useShipTypesIndex = (
  queryParams?: QueryParams,
  queryOptions: UseShipTypesIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: ['shipTypesIndex', queryParams],
    queryFn: () =>
      fetchData(endPoints.index.ship_type, zIndexPayload, queryParams),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

export const useCreateShipTypes = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(
    endPoints.create.ship_type,
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('shipTypesIndex');
          queryClient.invalidateQueries('shipTypesList');
        }
      },
    }
  );
};

interface UpdateShipTypesVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateShipTypes = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateShipTypesVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateShipTypesVariables>(
    ({ id }) => endPoints.update.ship_type.replace(':id', id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('shipTypesIndex');
          queryClient.invalidateQueries('shipTypesList');
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

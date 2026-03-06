import { UseQueryOptions, useQuery, useQueryClient } from 'react-query';

import {
  CreatePayload,
  ListPayload,
  QueryParams,
  ShipACIndexPayload,
  zCreatePayload,
  zListPayload,
  zShipACIndexPayload,
} from '../schema';
import {
  SubMasterMutationConfig,
  fetchData,
  useSubMasterMutation,
  useSubMasterPutMutation,
} from '../service';

import { endPoints } from '@/services/submaster/service';

type UseShipAccountListQueryOptions = UseQueryOptions<ListPayload>;
type UseShipAccountIndexQueryOptions = UseQueryOptions<ShipACIndexPayload>;

export const useShipAccountList = (
  queryOptions: UseShipAccountListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'shipAccountList',
    queryFn: () => fetchData(endPoints.list.ship_account, zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useShipAccountIndex = (
  queryParams?: QueryParams,
  queryOptions: UseShipAccountIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: ['shipAccountIndex', queryParams],
    queryFn: () =>
      fetchData(endPoints.index.ship_account, zShipACIndexPayload, queryParams),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useCreateShipAccount = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
      account_number: number;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(
    endPoints.create.ship_account,
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('shipAccountIndex');
          queryClient.invalidateQueries('shipAccountList');
        }
      },
    }
  );
};

interface UpdateShipAccountVariables {
  id: number; // Assuming id is a number
  name: string;
  account_number: number;
}

export const useUpdateShipAccount = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateShipAccountVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateShipAccountVariables>(
    ({ id }) => endPoints.update.ship_account.replace(':id', id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('shipAccountIndex');
          queryClient.invalidateQueries('shipAccountList');
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

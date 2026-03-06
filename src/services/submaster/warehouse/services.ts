import { UseQueryOptions, useQuery, useQueryClient } from 'react-query';

import { QueryParams } from '../schema';
import {
  SubMasterMutationConfig,
  fetchData,
  useSubMasterMutation,
  useSubMasterPutMutation,
} from '../service';
import {
  CreateWarehousePayload,
  WarehouseDetailsPayload,
  WarehouseIndexPayload,
  WarehouseListPayload,
  zCreateWarehousePayload,
  zWarehouseDetailsPayload,
  zWarehouseIndexPayload,
  zWarehouseListPayload,
} from './schema';

import { endPoints } from '@/services/submaster/service';

type UseWarehouseListQueryOptions = UseQueryOptions<WarehouseListPayload>;
type UseWarehouseIndexQueryOptions = UseQueryOptions<WarehouseIndexPayload>;
type UseWarehouseDetailsQueryOptions = UseQueryOptions<WarehouseDetailsPayload>;

export const useWarehouseList = (
  queryOptions: UseWarehouseListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'warehouseList',
    queryFn: () => fetchData(endPoints.list.warehouse, zWarehouseListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useWarehouseIndex = (
  queryParams?: QueryParams,
  queryOptions: UseWarehouseIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: ['spareTypeIndex', queryParams],
    queryFn: () =>
      fetchData(endPoints.index.warehouse, zWarehouseIndexPayload, queryParams),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

export const useWarehouseDetails = (
  id: number | string,
  queryOptions: UseWarehouseDetailsQueryOptions = {}
) =>
  useQuery({
    queryKey: ['warehouseDetails', id],
    queryFn: () =>
      fetchData(
        endPoints.info.warehouse.replace(':id', id),
        zWarehouseDetailsPayload
      ),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

interface CreateWarehouseVariables {
  name: string;
  consignee_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
  fax: string;
  email: string;
  remarks: string;
}

export const useCreateWarehouse = (
  config: SubMasterMutationConfig<
    CreateWarehousePayload,
    CreateWarehouseVariables
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(
    endPoints.create.warehouse,
    zCreateWarehousePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('warehouseIndex');
          queryClient.invalidateQueries('warehouseList');
        }
      },
    }
  );
};

interface UpdateWarehouseVariables {
  id: number; // Assuming id is a number
  name: string;
  consignee_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
  fax: string;
  email: string;
  remarks: string;
}

export const useUpdateWarehouse = (
  config: SubMasterMutationConfig<
    CreateWarehousePayload,
    Omit<UpdateWarehouseVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<
    CreateWarehousePayload,
    UpdateWarehouseVariables
  >(
    ({ id }) => endPoints.update.warehouse.replace(':id', id),
    zCreateWarehousePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('warehouseIndex');
          queryClient.invalidateQueries('warehouseList');
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

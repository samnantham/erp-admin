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

type UseShipViaListQueryOptions = UseQueryOptions<ListPayload>;
type UseShipViaIndexQueryOptions = UseQueryOptions<IndexPayload>;

export const useShipViaList = (queryOptions: UseShipViaListQueryOptions = {}) =>
  useQuery({
    queryKey: 'shipViaList',
    queryFn: () => fetchData(endPoints.list.ship_via, zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

  export const useShipViaIndex = (
    queryParams?: QueryParams,
    queryOptions: UseShipViaIndexQueryOptions = {}
  ) =>
    useQuery({
      queryKey: ['shipViaIndex', queryParams],
      queryFn: () =>
        fetchData(endPoints.index.ship_via, zIndexPayload, queryParams),
      ...queryOptions,
      //staleTime: 5 * 60 * 1000, // 5 minutes
      //cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    });

export const useCreateShipVia = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(endPoints.create.ship_via, zCreatePayload().parse, {
    ...config,
    onSuccess: (data, ...args) => {
      if (data.status) {
        config?.onSuccess?.(data, ...args);
        queryClient.invalidateQueries('shipViaIndex');
        queryClient.invalidateQueries('shipViaList');
      }
    },
  });
};

interface UpdateShipViaVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateShipVia = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateShipViaVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateShipViaVariables>(
    ({ id }) => endPoints.update.ship_via.replace(":id", id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('shipViaIndex');
          queryClient.invalidateQueries('shipViaList');
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

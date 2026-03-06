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

type UseBinLocationListQueryOptions = UseQueryOptions<ListPayload>;
type UseBinLocationIndexQueryOptions = UseQueryOptions<IndexPayload>;

export const useBinLocationList = (
  queryOptions: UseBinLocationListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'binLocationList',
    queryFn: () => fetchData(endPoints.list.bin_location, zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
    onError: (error) => {
      console.error('Error fetching bin location list:', error);
      queryOptions.onError?.(error);
    },
  });

export const useBinLocationIndex = (
  queryParams?: QueryParams,
  queryOptions: UseBinLocationIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: ['binLocationIndex', queryParams],
    queryFn: () =>
      fetchData(endPoints.index.bin_location, zIndexPayload, queryParams),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
    onError: (error) => {
      console.error('Error fetching bin location list:', error);
      queryOptions.onError?.(error);
    },
  });

export const useCreateBinLocation = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();
  return useSubMasterMutation(
    endPoints.create.bin_location,
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          queryClient.invalidateQueries('binLocationList');
          queryClient.invalidateQueries('binLocationIndex');
          config?.onSuccess?.(data, ...args);
        }
      },
    }
  );
};

interface UpdateBinLocationVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateBinLocation = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateBinLocationVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateBinLocationVariables>(
    ({ id }) => endPoints.update.bin_location.replace(':id', id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          queryClient.invalidateQueries('binLocationList');
          queryClient.invalidateQueries('binLocationIndex');
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

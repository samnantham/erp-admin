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

type UseCustomEntryListQueryOptions = UseQueryOptions<ListPayload>;
type UseCustomEntryIndexQueryOptions = UseQueryOptions<IndexPayload>;

export const useCustomEntryList = (
  queryOptions: UseCustomEntryListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'customEntryList',
    queryFn: () => fetchData(endPoints.list.custom_entry, zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useCustomEntryIndex = (
  queryParams?: QueryParams,
  queryOptions: UseCustomEntryIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: ['contactTypeIndex', queryParams],
    queryFn: () =>
      fetchData(endPoints.index.custom_entry, zIndexPayload, queryParams),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useCreateCustomEntry = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(
    endPoints.create.custom_entry,
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          queryClient.invalidateQueries('customEntryList');
          queryClient.invalidateQueries('customEntryIndex');
          config?.onSuccess?.(data, ...args);
        }
      },
    }
  );
};

interface UpdateCustomEntryVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateCustomEntry = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateCustomEntryVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateCustomEntryVariables>(
    ({ id }) => endPoints.update.custom_entry.replace(':id', id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          queryClient.invalidateQueries('customEntryList');
          queryClient.invalidateQueries('customEntryIndex');
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

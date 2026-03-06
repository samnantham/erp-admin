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

type UseContactTypeListQueryOptions = UseQueryOptions<ListPayload>;
type UseContactTypeIndexQueryOptions = UseQueryOptions<IndexPayload>;

export const useContactTypeList = (
  queryOptions: UseContactTypeListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'contactTypeList',
    queryFn: () => fetchData(endPoints.list.contact_type, zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useContactTypeIndex = (
  queryParams?: QueryParams,
  queryOptions: UseContactTypeIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: ['contactTypeIndex', queryParams],
    queryFn: () =>
      fetchData(endPoints.index.contact_type, zIndexPayload, queryParams),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useCreateContactType = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(
    endPoints.create.contact_type,
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          queryClient.invalidateQueries('contactTypeList');
          queryClient.invalidateQueries('contactTypeIndex');
          config?.onSuccess?.(data, ...args);
        }
      },
    }
  );
};

interface UpdateContactTypeVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateContactType = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateContactTypeVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateContactTypeVariables>(
    ({ id }) => endPoints.update.contact_type.replace(':id', id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          queryClient.invalidateQueries('contactTypeList');
          queryClient.invalidateQueries('contactTypeIndex');
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

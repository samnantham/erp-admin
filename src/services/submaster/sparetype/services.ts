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

type UseSpareTypeListQueryOptions = UseQueryOptions<ListPayload>;
type UseSpareTypeIndexQueryOptions = UseQueryOptions<IndexPayload>;

export const useSpareTypeList = (
  queryOptions: UseSpareTypeListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'spareTypeList',
    queryFn: () => fetchData(endPoints.list.spare_type, zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useSpareTypeIndex = (
  queryParams?: QueryParams,
  queryOptions: UseSpareTypeIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: ['spareTypeIndex', queryParams],
    queryFn: () =>
      fetchData(endPoints.index.spare_type, zIndexPayload, queryParams),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

export const useCreateSpareType = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(
    endPoints.create.spare_type,
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('spareTypeIndex');
          queryClient.invalidateQueries('spareTypeList');
        }
      },
    }
  );
};

interface UpdateSpareTypeVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateSpareType = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateSpareTypeVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateSpareTypeVariables>(
    ({ id }) => endPoints.update.spare_type.replace(':id', id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('spareTypeIndex');
          queryClient.invalidateQueries('spareTypeList');
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

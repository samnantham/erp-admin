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

type UsePackageTypeListQueryOptions = UseQueryOptions<ListPayload>;
type UsePackageTypeIndexQueryOptions = UseQueryOptions<IndexPayload>;

export const usePackageTypeList = (
  queryOptions: UsePackageTypeListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'packageTypeList',
    queryFn: () => fetchData(endPoints.list.package_type, zListPayload),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

export const usePackageTypeIndex = (
  queryParams?: QueryParams,
  queryOptions: UsePackageTypeIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: ['packageTypeIndex', queryParams],
    queryFn: () =>
      fetchData(endPoints.index.package_type, zIndexPayload, queryParams),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useCreatePackageType = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(
    endPoints.create.package_type,
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('packageTypeList');
          queryClient.invalidateQueries('packageTypeIndex');
        }
      },
    }
  );
};

interface UpdatePackageTypeVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdatePackageType = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdatePackageTypeVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdatePackageTypeVariables>(
    ({ id }) => endPoints.update.package_type.replace(':id', id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('packageTypeList');
          queryClient.invalidateQueries('packageTypeIndex');
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

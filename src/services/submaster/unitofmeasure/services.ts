import { UseQueryOptions, useQuery, useQueryClient } from 'react-query';

import {
  CreatePayload,
  IndexPayload,
  ListPayload,
  zCreatePayload,
  zListPayload,
  zUOMIndexPayload,
} from '../schema';
import {
  SubMasterMutationConfig,
  fetchData,
  useSubMasterMutation,
  useSubMasterPutMutation,
} from '../service';

const endPoints = import.meta.env.VITE_API_ENDPOINTS ? JSON.parse(import.meta.env.VITE_API_ENDPOINTS) : {};
type UseUnitOfMeasureListQueryOptions = UseQueryOptions<ListPayload>;
type UseUnitOfMeasureIndexQueryOptions = UseQueryOptions<IndexPayload>;

export const useUnitOfMeasureList = (
  queryOptions: UseUnitOfMeasureListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'unitOfMeasureList',
    queryFn: () => fetchData( endPoints.list.unit_of_measure , zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useUnitOfMeasureIndex = (
  queryOptions: UseUnitOfMeasureIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: 'unitOfMeasureIndex',
    queryFn: () => fetchData( endPoints.index.unit_of_measure, zUOMIndexPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useCreateUnitOfMeasure = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation( endPoints.create.unit_of_measure,
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('unitOfMeasureIndex');
          queryClient.invalidateQueries('unitOfMeasureList');
        }
      },
    }
  );
};

interface UpdateUnitOfMeasureVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateUnitOfMeasure = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateUnitOfMeasureVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateUnitOfMeasureVariables>(
    ({ id }) => endPoints.update.unit_of_measure.replace(":id", id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('unitOfMeasureIndex');
          queryClient.invalidateQueries('unitOfMeasureList');
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

import { UseQueryOptions, useQuery, useQueryClient } from 'react-query';

import {
  CreatePayload,
  IndexPayload,
  ListPayload,
  zCreatePayload,
  zListPayload,
} from '../schema';
import {
  SubMasterMutationConfig,
  fetchData,
  useSubMasterMutation,
  useSubMasterPutMutation,
} from '../service';

type UseTypeOfTagListQueryOptions = UseQueryOptions<ListPayload>;
type UseTypeOfTagIndexQueryOptions = UseQueryOptions<IndexPayload>;
import { endPoints } from '@/services/submaster/service';

export const useTypeOfTagList = (
  queryOptions: UseTypeOfTagListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'typeOfTagList',
    queryFn: () => fetchData(endPoints.list.type_of_tag, zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useTypeOfTagIndex = (
  queryOptions: UseTypeOfTagIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: 'typeOfTagIndex',
    queryFn: () => fetchData(endPoints.index.type_of_tag, zListPayload),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useCreateTypeOfTag = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(endPoints.create.type_of_tag, zCreatePayload().parse, {
    ...config,
    onSuccess: (data, ...args) => {
      if (data.status) {
        config?.onSuccess?.(data, ...args);
        queryClient.invalidateQueries('typeOfTagIndex');
        queryClient.invalidateQueries('typeOfTagList');
      }
    },
  });
};

interface UpdateTypeOfTagVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateTypeOfTag = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateTypeOfTagVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateTypeOfTagVariables>(
    ({ id }) => endPoints.create.type_of_tag.replace(":id", id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('typeOfTagIndex');
          queryClient.invalidateQueries('typeOfTagList');
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

import { UseQueryOptions, useQuery, useQueryClient } from 'react-query';

import {
  CreatePayload,
  DetailsPayload,
  IndexPayload,
  ListPayload,
  QueryParams,
  zCreatePayload,
  zDetailsPayload,
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

type UseModeOfReceiptListQueryOptions = UseQueryOptions<ListPayload>;
type UseModeOfReceiptIndexQueryOptions = UseQueryOptions<IndexPayload>;
type UseModeOfReceiptDetailQueryOptions = UseQueryOptions<DetailsPayload>;

export const useModeOfReceiptList = (
  queryOptions: UseModeOfReceiptListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'modeOfReceiptList',
    queryFn: () => fetchData(endPoints.list.mode_of_receipt, zListPayload),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

export const useModeOfReceiptIndex = (
  queryParams?: QueryParams,
  queryOptions: UseModeOfReceiptIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: ['modeOfReceiptIndex', queryParams],
    queryFn: () =>
      fetchData(endPoints.index.mode_of_receipt, zIndexPayload, queryParams),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useModeOfReceiptDetails = (
  id: number | string,
  queryOptions: UseModeOfReceiptDetailQueryOptions = {}
) =>
  useQuery({
    queryKey: ['modeOfReceiptDetails', id],
    queryFn: () =>
      fetchData(
        endPoints.info.mode_of_receipt.replace(':id', id),
        zDetailsPayload
      ),
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
    retry: 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

export const useCreateModeOfReceipt = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
    }
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterMutation(
    endPoints.create.mode_of_receipt,
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('modeOfReceiptIndex');
          queryClient.invalidateQueries('modeOfReceiptList');
        }
      },
    }
  );
};

interface UpdateModeOfReceiptVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdateModeOfReceipt = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdateModeOfReceiptVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdateModeOfReceiptVariables>(
    ({ id }) => endPoints.update.mode_of_receipt.replace(':id', id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('modeOfReceiptIndex');
          queryClient.invalidateQueries('modeOfReceiptList');
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

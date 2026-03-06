import { UseQueryOptions, useQuery, useQueryClient } from 'react-query';

import {
  CreatePayload,
  PaymentTermIndexPayload,
  ListPayload,
  zCreatePayload,
  zPaymentTermIndexPayload,
  zListPayload,
} from '../schema';
import {
  SubMasterMutationConfig,
  fetchData,
  useSubMasterMutation,
  useSubMasterPutMutation,
  useDeleteMutation
} from '../service';

const endPoints = import.meta.env.VITE_API_ENDPOINTS ? JSON.parse(import.meta.env.VITE_API_ENDPOINTS) : {};

type UsePaymentTermsListQueryOptions = UseQueryOptions<ListPayload>;
type UsePaymentTermsIndexQueryOptions = UseQueryOptions<PaymentTermIndexPayload>;


interface QueryParams {
  status?: string;
}

export const usePaymentTermsList = (
  queryOptions: UsePaymentTermsListQueryOptions = {}
) =>
  useQuery({
    queryKey: 'paymentTermsList',
    queryFn: () => fetchData(endPoints.list.payment_term, zListPayload),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

export const usePaymentTermsIndex = (
  queryParams?: QueryParams,
  queryOptions: UsePaymentTermsIndexQueryOptions = {}
) =>
  useQuery({
    queryKey: ['paymentTermsIndex', queryParams],
        queryFn: () =>
          fetchData(endPoints.index.payment_term, zPaymentTermIndexPayload, queryParams),
    ...queryOptions,
    //staleTime: 5 * 60 * 1000, // 5 minutes
    //cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

export const useCreatePaymentTerms = (
  config: SubMasterMutationConfig<
    CreatePayload,
    {
      name: string;
      no_of_days: number;
    }
  > = {}
) => {
  const queryClient = useQueryClient();
  return useSubMasterMutation(endPoints.create.payment_term, zCreatePayload().parse, {
    ...config,
    onSuccess: (data, ...args) => {
      if (data.status) {
        queryClient.invalidateQueries('paymentTermsList');
        queryClient.invalidateQueries('paymentTermsIndex');
        config?.onSuccess?.(data, ...args);
      }
    },
  });
};

interface UpdatePaymentTermsVariables {
  id: number; // Assuming id is a number
  name: string;
}

export const useUpdatePaymentTerms = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<UpdatePaymentTermsVariables, 'id'>
  > = {}
) => {
  const queryClient = useQueryClient();

  return useSubMasterPutMutation<CreatePayload, UpdatePaymentTermsVariables>(
    ({ id }) => endPoints.update.payment_term.replace(":id", id),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          queryClient.invalidateQueries('paymentTermsList');
          queryClient.invalidateQueries('paymentTermsIndex');
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

interface DeleteElementVariables {
  id: number; // Assuming id is a number
  deleted_reason?: string;
  permanent?: boolean;
}

export const useDeletePaymentTerm = (
  config: SubMasterMutationConfig<CreatePayload, DeleteElementVariables> = {}
) => {
  const queryClient = useQueryClient();

  return useDeleteMutation<CreatePayload, DeleteElementVariables>(
     ({ id, permanent }) => {
      const base = permanent
        ? endPoints.delete.payment_term_permanent   
        : endPoints.delete.payment_term;           

      return base.replace(":id", String(id));
    },
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          // invalidate the lists you use
          queryClient.invalidateQueries('paymentTermsList');
          queryClient.invalidateQueries('paymentTermsIndex');
        }
      },
      onMutate: async (variables) => variables,
    }
  );
};

interface RestoreVariables {
  id: number; 
}

export const useRestorePaymentTerm = (
  config: SubMasterMutationConfig<CreatePayload, RestoreVariables> = {}
) => {
  const queryClient = useQueryClient();

  return useDeleteMutation<CreatePayload, RestoreVariables>(
    // make sure :id is replaced with a string
    ({ id }) => endPoints.restore.payment_term.replace(':id', String(id)),
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
          // invalidate the lists you use
          queryClient.invalidateQueries('paymentTermsList');
          queryClient.invalidateQueries('paymentTermsIndex');
        }
      },
      onMutate: async (variables) => variables,
    }
  );
};

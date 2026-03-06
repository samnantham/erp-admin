import { AxiosError } from 'axios';
import { UseMutationOptions, useMutation } from 'react-query';
import { useToastError, useToastSuccess } from '@/components/Toast';
import { ApiResponse } from '@/types/api';

export function useApiMutation<
    TData extends ApiResponse = ApiResponse,
    TVariables = unknown
>(
    mutationFn: (vars: TVariables) => Promise<TData>,
    options: UseMutationOptions<TData, AxiosError<TData>, TVariables> = {}
) {
    const toastSuccess = useToastSuccess();
    const toastError = useToastError();
    return useMutation<TData, AxiosError<TData>, TVariables>(mutationFn, {
        ...options,

        onSuccess: (data, variables, context) => {
            if (data?.message) {
                toastSuccess({
                    title: 'Success',
                    description: data.message,
                });
            }

            options?.onSuccess?.(data, variables, context);
        },

        onError: (error, variables, context) => {
            toastError({
                title: 'Error',
                description:
                    error.response?.data?.message || error.message,
            });

            options?.onError?.(error, variables, context);
        },
    });
}
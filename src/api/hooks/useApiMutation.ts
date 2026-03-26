import { AxiosError } from "axios";
import { UseMutationOptions, useMutation } from "react-query";
import { useToastError, useToastSuccess } from "@/components/Toast";
import { ApiResponse } from "@/types/api";

interface ApiMutationOptions<TData, TVariables>
  extends UseMutationOptions<TData, AxiosError<TData>, TVariables> {
  showToast?: boolean;
}

export function useApiMutation<
  TData extends ApiResponse = ApiResponse,
  TVariables = unknown
>(
  mutationFn: (vars: TVariables) => Promise<TData>,
  options: ApiMutationOptions<TData, TVariables> = {}
) {
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();

  const { showToast = true, ...mutationOptions } = options;

  return useMutation<TData, AxiosError<TData>, TVariables>(mutationFn, {
    ...mutationOptions,

    onSuccess: (data, variables, context) => {
      if (showToast && data?.message) {
        toastSuccess({
          title: "Success",
          description: data.message,
        });
      }

      mutationOptions?.onSuccess?.(data, variables, context);
    },

    onError: (error, variables, context) => {
      if (showToast) {
        toastError({
          title: "Error",
          description: error.response?.data?.message || error.message,
        });
      }

      mutationOptions?.onError?.(error, variables, context);
    },
  });
}

export function useFileMutation<TVariables = unknown>(
  mutationFn: (vars: TVariables) => Promise<string>,
  options: UseMutationOptions<string, AxiosError, TVariables> = {}
) {
  return useMutation<string, AxiosError, TVariables>(mutationFn, {
    ...options,
  });
}
import { UseMutationOptions } from "react-query";
import { AxiosError } from "axios";
import { useApiMutation } from "@/api/hooks/useApiMutation";
import { postRequest } from "@/api/client";
import { ApiResp } from "@/services/global-service";

export const useBulkUpload = <
  TResponse extends ApiResp,
  TVariables
>(
  url: string,
  schema: any,
  options?: UseMutationOptions<TResponse, AxiosError<ApiResp>, TVariables>
) =>
  useApiMutation<TResponse, TVariables>(
    (payload) => postRequest(url, payload, schema),
    {
      ...options,
      showToast: false,
    }
  );
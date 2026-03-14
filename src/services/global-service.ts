import { UseMutationOptions } from "react-query";
import { AxiosError } from "axios";
import Axios from "axios";

import { useApiMutation } from "@/api/hooks/useApiMutation";
import { endPoints } from "@/api/endpoints";
import { UploadPayload, zUploadPayload, ApiResp } from "@/services/global-schema";

/* ================= Upload File ================= */

export const useFileUpload = (
  options?: UseMutationOptions<
    UploadPayload,
    AxiosError<ApiResp>,
    FormData
  >
) =>
  useApiMutation<UploadPayload, FormData>(
    async (formData) => {
      const response = await Axios.post(
        endPoints.others.upload,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return zUploadPayload().parse(response.data);
    },
    options
  );

/* ================= Generic Config ================= */

type CrudConfig<ResponsePayload> = {
  createUrl: string;
  updateUrl: string;
  schema: {
    parse: (data: unknown) => ResponsePayload;
  };
};

/* ================= Replace URL Params ================= */

function replaceUrlParams(url: string, variables: Record<string, any>) {
  return url.replace(/:([a-zA-Z_]+)/g, (_, key) => variables[key]);
}

/* ================= Generic Create / Update ================= */

export function useCreateUpdateService<
  ResponsePayload extends ApiResp,
  Variables extends Record<string, any>
>(
  config: CrudConfig<ResponsePayload>,
  options?: UseMutationOptions<
    ResponsePayload,
    AxiosError<ApiResp>,
    Variables
  >
) {
  return useApiMutation<ResponsePayload, Variables>(
    async (variables) => {
      const { id, ...payload } = variables;

      const url = id
        ? replaceUrlParams(config.updateUrl, variables)
        : replaceUrlParams(config.createUrl, variables);

      const response = id
        ? await Axios.put(url, payload)
        : await Axios.post(url, payload);

      return config.schema.parse(response.data);
    },
    options
  );
}
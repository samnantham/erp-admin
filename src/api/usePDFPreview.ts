import Axios from "axios";
import { useFileMutation } from "@/api/hooks/useApiMutation";
import { UseMutationOptions } from "react-query";
import { AxiosError } from "axios";

export const usePreviewPDF = (
  config: { url: string },
  options: UseMutationOptions<string, AxiosError, any> = {}
) => {
  return useFileMutation(
    async (payload: any) => {
      const response = await Axios.post(config.url, payload, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      return URL.createObjectURL(blob);
    },
    {
      ...options, // ✅ now supports onSuccess, onError etc
    }
  );
};
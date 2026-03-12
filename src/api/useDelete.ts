import Axios from 'axios';
import { useQueryClient } from 'react-query';
import { useApiMutation } from '@/api/hooks/useApiMutation';

interface DeleteParams {
  id: string | number;
  deleted_reason?: string;
}

export const useDelete = (config: {
  url: string;
  invalidate?: string[];
}) => {
  const queryClient = useQueryClient();

  return useApiMutation(
    async ({ id, deleted_reason }: DeleteParams) => {
      const res = await Axios.delete(
        config.url.replace(':id', String(id)),
        {
          data: deleted_reason ? { deleted_reason } : undefined,
        }
      );

      return res.data;
    },
    {
      onSuccess: () => {
        config.invalidate?.forEach((key) =>
          queryClient.invalidateQueries(key)
        );
      },
    }
  );
};
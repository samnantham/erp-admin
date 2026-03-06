import Axios from 'axios';
import { useQueryClient } from 'react-query';
import { useApiMutation } from '@/api/hooks/useApiMutation';

export const useDelete = (config: {
  url: string;
  invalidate?: string[];
}) => {
  const queryClient = useQueryClient();

  return useApiMutation(
    async ({ id }: { id: string | number }) => {
      const res = await Axios.delete(
        config.url.replace(':id', String(id))
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
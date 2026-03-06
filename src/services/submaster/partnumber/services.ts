import { CreatePayload, zCreatePayload } from '../schema';
import { SubMasterMutationConfig, useSubMasterPostMutation } from '../service';

const endPoints = import.meta.env.VITE_API_ENDPOINTS ? JSON.parse(import.meta.env.VITE_API_ENDPOINTS) : {};

interface CreatePartNumberVariables {
  id: number | null | undefined; // Assuming id is a number
  part_number: string;
}

export const useCreatePartNumber = (
  config: SubMasterMutationConfig<
    CreatePayload,
    Omit<CreatePartNumberVariables, 'id'>
  > = {}
) => {
  return useSubMasterPostMutation<CreatePayload, CreatePartNumberVariables>(
    ({ id }) => `${endPoints.index.spare}/add-alternate-part-number/${id}`,
    zCreatePayload().parse,
    {
      ...config,
      onSuccess: (data, ...args) => {
        if (data.status) {
          config?.onSuccess?.(data, ...args);
        }
      },
      onMutate: async (variables) => {
        const { id, ...rest } = variables;
        return rest; // Return variables excluding 'id'
      },
    }
  );
};

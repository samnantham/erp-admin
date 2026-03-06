import Axios, { AxiosError } from 'axios';
import { UseMutationOptions, useMutation } from 'react-query';

import { useAuthContext } from './AuthContext';
import { LoginPayload, zLoginPayload } from './schema';
import { endPoints } from '@/api/endpoints';

type AuthMutationConfig<T, Variables> = UseMutationOptions<
  T,
  AxiosError<T>,
  Variables
>;

const useAuthMutation = <T, Variables>(
  endpoint: string,
  parseResponse: (data: TODO) => T,
  config: AuthMutationConfig<T, Variables>
) => {
  return useMutation(
    async (variables: Variables) => {
      const response = await Axios.post(endpoint, variables);
      return parseResponse(response.data);
    },
    {
      ...config,
      onSuccess: (data, ...args) => {
        config?.onSuccess?.(data, ...args);
      },
    }
  );
};

export const useLogin = (
  config: AuthMutationConfig<
    LoginPayload,
    {
      username: string;
      password: string;
    }
  > = {}
) => {
  const { updateToken } = useAuthContext();

  return useAuthMutation( endPoints.authentication.login , zLoginPayload().parse, {
    ...config,
    onSuccess: (data, ...args) => {
      if (data.status) {
        updateToken(data?.data.token);
        config?.onSuccess?.(data, ...args);
      }
    },
  });
};

import { useMutation, UseMutationOptions, useQuery } from 'react-query';
import { getRequest, putRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';

import {
  UpdateResponsePayload,
  zProfileDetailsPayload,
  zUpdateResponsePayload,
} from '@/services/profile/schema';

export const useProfileInfo = () =>
  useQuery({
    queryKey: ['ProfileInfo'],
    queryFn: () =>
      getRequest(
        endPoints.profile.info,          // ✅ from endpoints.ts
        zProfileDetailsPayload
      ),
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    retry: 2,
  });

/* ================= Update Profile ================= */

interface UserProfileVariables {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_id: string | null;
  role_id: string | null;
}

export const useUpdateProfile = (
  config?: UseMutationOptions<
    UpdateResponsePayload,
    Error,
    UserProfileVariables
  >
) =>
  useMutation<
    UpdateResponsePayload,
    Error,
    UserProfileVariables
  >({
    mutationFn: async (variables) => {
      return await putRequest(
        endPoints.profile.profile_update,
        variables,
        zUpdateResponsePayload
      );
    },
    ...config,
  });

/* ================= Update Password ================= */

interface UserPasswordVariables {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const useUpdatePassword = (
  config?: UseMutationOptions<
    UpdateResponsePayload,
    Error,
    UserPasswordVariables
  >
) =>
  useMutation<
    UpdateResponsePayload,
    Error,
    UserPasswordVariables
  >({
    mutationFn: async (variables) => {
      return await putRequest(
        endPoints.profile.password_update,
        variables,
        zUpdateResponsePayload
      );
    },
    ...config,
  });

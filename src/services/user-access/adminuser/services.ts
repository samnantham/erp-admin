import { useQuery, UseQueryOptions  } from 'react-query';

import { getRequest, postRequest, putRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';
import { useApiMutation } from '@/api/hooks/useApiMutation';

import {
  zDropdownPayload,
  DropdownPayload,
  QueryParams
} from '@/services/global-schema';

import {
  AdminUserDetailsPayload,
  CreateAdminUserPayload,
  zAdminUserIndexPayload,
  zAdminUserListPayload,
  zAdminUserDetailsPayload,
  zCreateAdminUserPayload,
} from './schema';


/* ================= Admin User List ================= */

export const useAdminUserList = () =>
  useQuery({
    queryKey: ['adminUserList'],
    queryFn: () =>
      getRequest(
        endPoints.list.user,
        zAdminUserListPayload
      ),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Admin User Index ================= */

export const useAdminUserIndex = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ['adminUserIndex', queryParams],
    queryFn: () =>
      getRequest(
        endPoints.index.user,
        zAdminUserIndexPayload,
        queryParams
      ),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Admin User Details ================= */

export const useAdminUserDetails = (
  id?: number | string,
  options?: UseQueryOptions<AdminUserDetailsPayload>
) =>
  useQuery<AdminUserDetailsPayload>({
    queryKey: ["adminUserDetails", id],
    queryFn: () =>
      getRequest(
        endPoints.info.user.replace(":id", String(id)),
        zAdminUserDetailsPayload
      ),
    enabled: !!id,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });

/* ================= Create Admin User ================= */

interface CreateAdminUserVariables {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_id: string;
  department_role_id: string;
  password: string;
}

export const useCreateAdminUser = () =>
  useApiMutation<CreateAdminUserPayload, CreateAdminUserVariables>(
    (variables) =>
      postRequest(
        endPoints.create.user,
        variables,
        zCreateAdminUserPayload
      )
  );

/* ================= Update Admin User ================= */

interface UpdateAdminUserVariables {
  id: number | string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department_id: string;
  department_role_id: string;
  password?: string;
}

export const useUpdateAdminUser = () =>
  useApiMutation<CreateAdminUserPayload, UpdateAdminUserVariables>(
    ({ id, ...rest }) =>
      putRequest(
        endPoints.update.user.replace(':id', String(id)),
        rest,
        zCreateAdminUserPayload
      )
  );

  export const useAdminUserDropdowns = () =>
  useQuery<DropdownPayload>({
    queryKey: ['adminUserDropdowns'],
    queryFn: () =>
      getRequest(
        endPoints.drop_downs.user,
        zDropdownPayload
      ),
    retry: 2,
    refetchOnWindowFocus: false,
  });
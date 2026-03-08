import { useQuery } from 'react-query';

import { getRequest, postRequest, putRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';
import { useApiMutation } from '@/api/hooks/useApiMutation';

import {
  CreatePayload,
  zIndexPayload,
  zListPayload,
  zDetailsPayload,
  zCreatePayload,
  QueryParams
} from '@/services/global-schema';

/* ================= Role List ================= */

export const useRoleList = () =>
  useQuery({
    queryKey: ['userRoleList'],
    queryFn: () =>
      getRequest(endPoints.list.role, zListPayload),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Role Index ================= */

export const useRoleIndex = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ['userRoleIndex', queryParams],
    queryFn: () =>
      getRequest(
        endPoints.index.role,
        zIndexPayload,
        queryParams
      ),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Role Details ================= */

export const useRoleDetails = (id: number | string) =>
  useQuery({
    queryKey: ['userRoleDetails', id],
    queryFn: () =>
      getRequest(
        endPoints.info.role.replace(':id', String(id)),
        zDetailsPayload
      ),
    enabled: !!id,
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Create Role ================= */

interface CreateRoleVariables {
  name: string;
}

export const useCreateRole = () =>
  useApiMutation<CreatePayload, CreateRoleVariables>((variables) =>
    postRequest(
      endPoints.create.role,
      variables,
      zCreatePayload
    )
  );

/* ================= Update Role ================= */

interface UpdateRoleVariables {
  id: number | string;
  name: string;
}

export const useUpdateRole = () =>
  useApiMutation<CreatePayload, UpdateRoleVariables>(
    ({ id, ...rest }) =>
      putRequest(
        endPoints.update.role.replace(':id', String(id)),
        rest,
        zCreatePayload
      )
  );
// src/services/user-access/role/services.ts

import { useQuery } from 'react-query';
import { getRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';
import { useCreateUpdateService } from '@/services/global-service';
import { QueryParams, zCreatePayload, CreatePayload, zListPayload, zIndexPayload, zDetailsPayload  } from '@/services/global-schema';

/* ================= Role List ================= */

export const useRoleList = () =>
  useQuery({
    queryKey: ['userRoleList'],
    queryFn:  () => getRequest(endPoints.list.role, zListPayload),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Role Index ================= */

export const useRoleIndex = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ['userRoleIndex', queryParams],
    queryFn:  () => getRequest(endPoints.index.role, zIndexPayload, queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Role Details ================= */

export const useRoleDetails = (id?: string) =>
  useQuery({
    queryKey: ['userRoleDetails', id],
    queryFn:  () => getRequest(endPoints.info.role.replace(':id', String(id)), zDetailsPayload),
    enabled:  !!id,
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Role Variables ================= */

export interface RoleVariables {
  id?:            string;
  name:           string;
  is_fixed?:      boolean;
  is_super_admin?: boolean;
}

/* ================= Create / Update Role ================= */

export const useSaveRole = () =>
  useCreateUpdateService<CreatePayload, RoleVariables>({
    createUrl: endPoints.create.role,
    updateUrl: endPoints.update.role,
    schema:    zCreatePayload,
  });
import { useQuery } from 'react-query';

import { getRequest, postRequest, putRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';
import { useApiMutation } from '@/api/hooks/useApiMutation';

import {
  CreatePayload,
  zListPayload,
  zDetailsPayload,
  zCreatePayload,
} from '@/services/global-schema';

import { zIndexPayload } from '@/services/user-access/department/schema'

import { QueryParams } from '@/services/submaster/schema';

/* ================= Department List ================= */

export const useDepartmentList = () =>
  useQuery({
    queryKey: ['userDepartmentList'],
    queryFn: () =>
      getRequest(endPoints.list.department, zListPayload),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Department Index ================= */

export const useDepartmentIndex = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ['userDepartmentIndex', queryParams],
    queryFn: () =>
      getRequest(
        endPoints.index.department,
        zIndexPayload,
        queryParams
      ),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Department Details ================= */

export const useDepartmentDetails = (id: number | string) =>
  useQuery({
    queryKey: ['userDepartmentDetails', id],
    queryFn: () =>
      getRequest(
        endPoints.info.department.replace(':id', String(id)),
        zDetailsPayload
      ),
    enabled: !!id,
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Create Department ================= */

interface CreateDepartmentVariables {
  name: string;
  emails: string;
}

export const useCreateDepartment = () =>
  useApiMutation<CreatePayload, CreateDepartmentVariables>((variables) =>
    postRequest(
      endPoints.create.department,
      variables,
      zCreatePayload
    )
  );

/* ================= Update Department ================= */

interface UpdateDepartmentVariables {
  id: number | string;
  name: string;
  emails: string;
}

export const useUpdateDepartment = () =>
  useApiMutation<CreatePayload, UpdateDepartmentVariables>(
    ({ id, ...rest }) =>
      putRequest(
        endPoints.update.department.replace(':id', String(id)),
        rest,
        zCreatePayload
      )
  );
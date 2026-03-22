// src/services/user-access/department/services.ts

import { useQuery } from 'react-query';
import { getRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';
import { useCreateUpdateService } from '@/services/global-service';
import { QueryParams, zCreatePayload, CreatePayload } from '@/services/global-schema';
import { zIndexPayload, zDetailsPayload } from './schema';

/* ================= Department List ================= */

export const useDepartmentList = () =>
  useQuery({
    queryKey: ['userDepartmentList'],
    queryFn:  () => getRequest(endPoints.list.department, zIndexPayload),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Department Index ================= */

export const useDepartmentIndex = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ['userDepartmentIndex', queryParams],
    queryFn:  () => getRequest(endPoints.index.department, zIndexPayload, queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Department Details ================= */

export const useDepartmentDetails = (id?: string) =>
  useQuery({
    queryKey: ['userDepartmentDetails', id],
    queryFn:  () => getRequest(endPoints.info.department.replace(':id', String(id)), zDetailsPayload),
    enabled:  !!id,
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Department Variables ================= */

export interface DepartmentVariables {
  id?:  string;
  name: string;
}

/* ================= Create / Update Department ================= */

export const useSaveDepartment = () =>
  useCreateUpdateService<CreatePayload, DepartmentVariables>({
    createUrl: endPoints.create.department,
    updateUrl: endPoints.update.department,
    schema:    zCreatePayload,
  });
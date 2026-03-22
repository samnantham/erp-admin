// src/services/user-access/route/services.ts

import { useQuery } from 'react-query';
import { getRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';
import { useCreateUpdateService } from '@/services/global-service';
import { QueryParams, zCreatePayload, CreatePayload, zListPayload } from '@/services/global-schema';
import { zIndexPayload, zDetailsPayload } from '@/services/user-access/route/schema';
/* ================= Route List ================= */

export const useRouteList = () =>
  useQuery({
    queryKey: ['userRouteList'],
    queryFn:  () => getRequest(endPoints.list.route, zListPayload),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Route Index ================= */

export const useRouteIndex = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ['userRouteIndex', queryParams],
    queryFn:  () => getRequest(endPoints.index.route, zIndexPayload, queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Route Details ================= */

export const useRouteDetails = (id?: string) =>
  useQuery({
    queryKey: ['userRouteDetails', id],
    queryFn:  () => getRequest(endPoints.info.route.replace(':id', String(id)), zDetailsPayload),
    enabled:  !!id,
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Route Variables ================= */

export interface RouteVariables {
  id?:    string;
  name:   string;
  path:   string;
  module: string;
}

/* ================= Create / Update Route ================= */

export const useSaveRoute = () =>
  useCreateUpdateService<CreatePayload, RouteVariables>({
    createUrl: endPoints.create.route,
    updateUrl: endPoints.update.route,
    schema:    zCreatePayload,
  });
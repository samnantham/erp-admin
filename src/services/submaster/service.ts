import { z } from "zod";
import { useQuery, UseQueryOptions } from 'react-query';

import { getRequest, postRequest, putRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';
import { useApiMutation } from '@/api/hooks/useApiMutation';
import { zBasicObject, zPagination } from '@/services/global-schema';
import { submasterConfig } from "@/pages/Submaster/submasterConfig";

import {
  CreatePayload,
  zListPayload,
  zCreatePayload,
  QueryParams
} from '@/services/global-schema';

const getSchema = (model: string) => {
  const config =
    submasterConfig[model] ?? submasterConfig.default;

  const base = config?.schema ?? zBasicObject;

  return base.extend({
    actions: z.string().optional(),
  });
};

/* ================= SubmasterItem List ================= */

export const useSubmasterItemList = (model: string) =>
  useQuery({
    queryKey: ['submasterItemList', model],
    queryFn: () =>
      getRequest(
        endPoints.list.submaster.replace(':model', model),
        zListPayload
      ),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= SubmasterItem Index ================= */

export const useSubmasterItemIndex = (
  model: string,
  queryParams?: QueryParams
) => {

  const zIndexPayload = z.object({
    data: z.array(getSchema(model)),
      pagination: zPagination.optional(),
    
  });

  return useQuery({
    queryKey: ["submasterItemIndex", model, queryParams],
    queryFn: () =>
      getRequest(
        endPoints.index.submaster.replace(":model", model),
        zIndexPayload,
        queryParams
      ),
  });
};
/* ================= SubmasterItem Details ================= */

export const useSubmasterItemDetails = (
  model: string,
  id: number | string,
  options?: UseQueryOptions<any>
) => {

  const zDetailsPayload = z.object({
    data: getSchema(model),
    status: z.boolean(),
  });

  type DetailsPayload = z.infer<typeof zDetailsPayload>;

  return useQuery<DetailsPayload>({
    queryKey: ["submasterItemDetails", model, id],
    queryFn: () =>
      getRequest(
        endPoints.info.submaster
          .replace(":model", model)
          .replace(":id", String(id)),
        zDetailsPayload
      ),
    enabled: !!id,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });
};

/* ================= Create SubmasterItem ================= */

interface CreateSubmasterItemVariables {
  name: string;
  code?: string;
}

export const useCreateSubmasterItem = (model: string) =>
  useApiMutation<CreatePayload, CreateSubmasterItemVariables>((variables) =>
    postRequest(
      endPoints.create.submaster.replace(':model', model),
      variables,
      zCreatePayload
    )
  );

/* ================= Update SubmasterItem ================= */

interface UpdateSubmasterItemVariables {
  id: number | string;
  name: string;
  code?: string;
}

export const useUpdateSubmasterItem = (model: string) =>
  useApiMutation<CreatePayload, UpdateSubmasterItemVariables>(
    ({ id, ...rest }) =>
      putRequest(
        endPoints.update.submaster
          .replace(':model', model)
          .replace(':id', String(id)),
        rest,
        zCreatePayload
      )
  );
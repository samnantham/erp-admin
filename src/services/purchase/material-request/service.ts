import { useQuery, UseQueryOptions } from 'react-query';
import { useCreateUpdateService } from '@/services/global-service';
import { getRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';
import { zDropdownPayload, DropdownPayload, QueryParams } from '@/services/global-schema';

import {
MaterialRequestDetailsPayload,
MaterialRequestSaveResponsePayload,
zMaterialRequestIndexPayload,
zMaterialRequestDetailsPayload,
zMaterialRequestSaveResponsePayload
} from '@/services/purchase/material-request/schema';

/* ================= Material Request Index ================= */

export const useMaterialRequestIndex = (queryParams?: QueryParams) =>
useQuery({
queryKey: ['materialRequestIndex', queryParams],
queryFn: () =>
getRequest(
endPoints.index.material_request,
zMaterialRequestIndexPayload,
queryParams
),
retry: 2,
refetchOnWindowFocus: false,
});

/* ================= Material Request Details ================= */

export const useMaterialRequestDetails = (
id?: string,
options?: UseQueryOptions<MaterialRequestDetailsPayload>
) =>
useQuery<MaterialRequestDetailsPayload>({
queryKey: ['materialRequestDetails', id],
queryFn: () =>
getRequest(
endPoints.info.material_request.replace(':id', String(id)),
zMaterialRequestDetailsPayload
),
enabled: !!id,
retry: 2,
refetchOnWindowFocus: false,
...options,
});

/* ================= Material Request Variables ================= */

export interface MaterialRequestVariables {
id?: string;
type: string;
due_date: string;
remark?: string;

is_closed?: boolean;
is_editable?: boolean;
update_request_status?: boolean;

priority_id: string;
user_id: string;
sales_log_id?: string;
}

/* ================= Create / Update Material Request ================= */


export const useSaveMaterialRequest = () =>
  useCreateUpdateService<MaterialRequestSaveResponsePayload, MaterialRequestVariables>({
    createUrl: endPoints.create.material_request,
    updateUrl: endPoints.update.material_request,
    schema:    zMaterialRequestSaveResponsePayload,
  });

/* ================= Material Request Dropdowns ================= */

export const useMaterialRequestDropdowns = () =>
useQuery<DropdownPayload>({
queryKey: ['materialRequestDropdowns'],
queryFn: () =>
getRequest(
endPoints.drop_downs.material_request,
zDropdownPayload
),
retry: 2,
refetchOnWindowFocus: false,
});

import { useQuery, UseQueryOptions, UseMutationOptions } from "react-query";
import { useCreateUpdateService } from "@/services/global-service";
import { getRequest } from "@/api/client";
import { endPoints } from "@/api/endpoints";
import { AxiosError } from "axios";
import { ApiResp, QueryParams } from "@/services/global-schema";

import {
    ReturnOrderDetailsPayload,
    ReturnOrderCreateResponse,
    ReturnOrderIndexPayload,
    zReturnOrderIndexPayload,
    zReturnOrderDetailsPayload,
    zReturnOrderCreateResponse,
    zReturnOrderListPayload,
} from "@/services/purchase/return-order/schema";

/* =========================================================
   Variable Types
========================================================= */

export interface ReturnOrderItemVariable {
    po_item_id:       string;
    invoice_item_id?: string | null;
    invoice_type?:    'invoice' | 'proforma' | null;
    return_qty:       number;
    return_amount:    number;
    remarks?:         string | null;
}

export interface ReturnOrderVariables {
    id?:                     string;
    purchase_order_id:       string;
    invoice_reference_type:  'invoice' | 'proforma';
    invoice_reference_id:    string;
    return_date:             string;
    remarks?:                string;
    payment_mode_id:         string;
    items:                   ReturnOrderItemVariable[];
}

/* =========================================================
   Index
========================================================= */

export const useReturnOrderIndex = (
    queryParams?: QueryParams,
    options?: Omit<UseQueryOptions<ReturnOrderIndexPayload>, 'queryKey' | 'queryFn'>
) =>
    useQuery<ReturnOrderIndexPayload>({
        queryKey: ['returnOrderIndex', queryParams],
        queryFn:  () => getRequest(endPoints.index.return_order, zReturnOrderIndexPayload, queryParams),
        retry: 2,
        refetchOnWindowFocus: false,
        enabled: true,
        ...options,
    });

/* =========================================================
   Details
========================================================= */

export const useReturnOrderDetails = (
    id?: string,
    options?: UseQueryOptions<ReturnOrderDetailsPayload>
) =>
    useQuery<ReturnOrderDetailsPayload>({
        queryKey: ['returnOrderDetails', id],
        queryFn:  () => getRequest(
            endPoints.info.return_order.replace(':id', String(id)),
            zReturnOrderDetailsPayload
        ),
        enabled: !!id,
        retry: 2,
        refetchOnWindowFocus: false,
        ...options,
    });

/* =========================================================
   Create / Update
========================================================= */

export const useSaveReturnOrder = (
    options?: UseMutationOptions<ReturnOrderCreateResponse, AxiosError<ApiResp>, ReturnOrderVariables>
) =>
    useCreateUpdateService<ReturnOrderCreateResponse, ReturnOrderVariables>(
        {
            createUrl: endPoints.create.return_order,
            updateUrl: endPoints.update.return_order,
            schema:    zReturnOrderCreateResponse(),
        },
        options
    );

/* =========================================================
   List
========================================================= */

export const useReturnOrderList = ({
    enabled = true,
    queryParams,
}: { enabled?: boolean; queryParams?: QueryParams } = {}) =>
    useQuery({
        queryKey: ['returnOrderList', queryParams],
        queryFn:  () => getRequest(endPoints.list.return_order, zReturnOrderListPayload, queryParams),
        retry: 2,
        refetchOnWindowFocus: false,
        enabled,
    });
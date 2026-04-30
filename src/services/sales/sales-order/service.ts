import { useQuery, UseQueryOptions, UseMutationOptions } from "react-query";
import { useCreateUpdateService } from "@/services/global-service";
import { getRequest } from "@/api/client";
import { endPoints } from "@/api/endpoints";
import { AxiosError } from "axios";
import { ApiResp, QueryParams } from "@/services/global-schema";

import {
    SalesOrderDetailsPayload,
    SalesOrderCreateResponse,
    SalesOrderIndexPayload,
    SalesOrderVariables,
    zSalesOrderIndexPayload,
    zSalesOrderDetailsPayload,
    zSalesOrderCreateResponse,
    zSalesOrderListPayload,
} from "@/services/sales/sales-order/schema";

/* =========================================================
   Index
========================================================= */

export const useSalesOrderIndex = (
    queryParams?: QueryParams,
    options?: Omit<UseQueryOptions<SalesOrderIndexPayload>, "queryKey" | "queryFn">
) =>
    useQuery<SalesOrderIndexPayload>({
        queryKey: ["salesOrderIndex", queryParams],
        queryFn:  () => getRequest(endPoints.index.sales_order, zSalesOrderIndexPayload, queryParams),
        retry: 2,
        refetchOnWindowFocus: false,
        enabled: true,
        ...options,
    });

/* =========================================================
   Details
========================================================= */

export const useSalesOrderDetails = (
    id?: string,
    options?: UseQueryOptions<SalesOrderDetailsPayload>
) =>
    useQuery<SalesOrderDetailsPayload>({
        queryKey: ["salesOrderDetails", id],
        queryFn:  () => getRequest(
            endPoints.info.sales_order.replace(":id", String(id)),
            zSalesOrderDetailsPayload
        ),
        enabled: !!id,
        retry: 2,
        refetchOnWindowFocus: false,
        ...options,
    });

/* =========================================================
   Create / Update
========================================================= */

export const useSaveSalesOrder = (
    options?: UseMutationOptions<SalesOrderCreateResponse, AxiosError<ApiResp>, SalesOrderVariables>
) =>
    useCreateUpdateService<SalesOrderCreateResponse, SalesOrderVariables>(
        {
            createUrl: endPoints.create.sales_order,
            updateUrl: endPoints.update.sales_order,
            schema:    zSalesOrderCreateResponse(),
        },
        options
    );

/* =========================================================
   List (dropdown)
========================================================= */

export const useSalesOrderList = ({
    enabled = true,
    queryParams,
}: { enabled?: boolean; queryParams?: QueryParams } = {}) =>
    useQuery({
        queryKey: ["salesOrderList", queryParams],
        queryFn:  () => getRequest(endPoints.list.sales_order, zSalesOrderListPayload, queryParams),
        retry: 2,
        refetchOnWindowFocus: false,
        enabled,
    });
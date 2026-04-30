import { useQuery, UseQueryOptions, UseMutationOptions, useMutation } from "react-query";
import { useCreateUpdateService } from "@/services/global-service";
import { getRequest, patchRequest } from "@/api/client";
import { endPoints } from "@/api/endpoints";
import { AxiosError } from "axios";
import { ApiResp, QueryParams } from "@/services/global-schema";

import {
    SalesQuotationDetailsPayload,
    SalesQuotationCreateResponse,
    SalesQuotationIndexPayload,
    SalesQuotationVariables,
    zSalesQuotationIndexPayload,
    zSalesQuotationDetailsPayload,
    zSalesQuotationCreateResponse,
    zSalesQuotationListPayload,
} from "@/services/sales/quotation/schema";

/* =========================================================
   Index
========================================================= */

export const useSalesQuotationIndex = (
    queryParams?: QueryParams,
    options?: Omit<UseQueryOptions<SalesQuotationIndexPayload>, "queryKey" | "queryFn">
) =>
    useQuery<SalesQuotationIndexPayload>({
        queryKey: ["salesQuotationIndex", queryParams],
        queryFn:  () => getRequest(endPoints.index.sales_quotation, zSalesQuotationIndexPayload, queryParams),
        retry: 2,
        refetchOnWindowFocus: false,
        enabled: true,
        ...options,
    });

/* =========================================================
   Details
========================================================= */

export const useSalesQuotationDetails = (
    id?: string,
    options?: UseQueryOptions<SalesQuotationDetailsPayload>
) =>
    useQuery<SalesQuotationDetailsPayload>({
        queryKey: ["salesQuotationDetails", id],
        queryFn:  () => getRequest(
            endPoints.info.sales_quotation.replace(":id", String(id)),
            zSalesQuotationDetailsPayload
        ),
        enabled: !!id,
        retry: 2,
        refetchOnWindowFocus: false,
        ...options,
    });

/* =========================================================
   Create / Update
========================================================= */

export const useSaveSalesQuotation = (
    options?: UseMutationOptions<SalesQuotationCreateResponse, AxiosError<ApiResp>, SalesQuotationVariables>
) =>
    useCreateUpdateService<SalesQuotationCreateResponse, SalesQuotationVariables>(
        {
            createUrl: endPoints.create.sales_quotation,
            updateUrl: endPoints.update.sales_quotation,
            schema:    zSalesQuotationCreateResponse(),
        },
        options
    );

/* =========================================================
   List (dropdown)
========================================================= */

export const useSalesQuotationList = ({
    enabled = true,
    queryParams,
}: { enabled?: boolean; queryParams?: QueryParams } = {}) =>
    useQuery({
        queryKey: ["salesQuotationList", queryParams],
        queryFn:  () => getRequest(endPoints.list.sales_quotation, zSalesQuotationListPayload, queryParams),
        retry: 2,
        refetchOnWindowFocus: false,
        enabled,
    });
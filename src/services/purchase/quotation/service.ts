import { useQuery, UseQueryOptions, useMutation } from 'react-query';
import { useCreateUpdateService } from '@/services/global-service';
import { getRequest, postRequest, putRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';
import { zDropdownPayload, DropdownPayload, QueryParams } from '@/services/global-schema';
import {
    PurchaseQuotationDetailsPayload,
    PurchaseQuotationSaveResponsePayload,
    QuotationItemSaveResponsePayload,
    QuotationItemsPayload,
    zPurchaseQuotationIndexPayload,
    zPurchaseQuotationDetailsPayload,
    zPurchaseQuotationSaveResponsePayload,
    zQuotationItemSaveResponsePayload,
    zQuotationItemsPayload,
    zQuotationListPayload,
    QuotationLineItemUpdateVariables,
    QuotationLineItemUpdateResponsePayload,
    zQuotationLineItemUpdateResponsePayload,
    QuotationsByRfqPayload,
    zQuotationsByRfqPayload,
} from '@/services/purchase/quotation/schema';

/* ================= Quotation Index ================= */
export const usePurchaseQuotationIndex = (queryParams?: QueryParams) =>
    useQuery({
        queryKey: ['purchaseQuotationIndex', queryParams],
        queryFn: () =>
            getRequest(
                endPoints.index.purchase_quotation,
                zPurchaseQuotationIndexPayload,
                queryParams
            ),
        retry: 2,
        refetchOnWindowFocus: false,
    });

/* ================= Quotation Details ================= */
export const usePurchaseQuotationDetails = (
    id?: string,
    options?: UseQueryOptions<PurchaseQuotationDetailsPayload>
) =>
    useQuery<PurchaseQuotationDetailsPayload>({
        queryKey: ['purchaseQuotationDetails', id],
        queryFn: () =>
            getRequest(
                endPoints.info.purchase_quotation.replace(':id', String(id)),
                zPurchaseQuotationDetailsPayload
            ),
        enabled: !!id,
        retry: 2,
        refetchOnWindowFocus: false,
        ...options,
    });

/* ================= Quotation Variables ================= */
export interface PurchaseQuotationVariables {
    id?: string;
    prfq_id: string;
    vendor_id: string;
    currency_id: string;
    vendor_quotation_no?: string;
    vendor_quotation_date: string;
    expiry_date?: string;
    remarks?: string;
    quotation_file?: string;
    version?: number;
    is_closed?: boolean;
    is_editable?: boolean;
    is_empty?: boolean;
    update_request_status?: boolean;
}

/* ================= Create / Update Quotation ================= */
export const useSavePurchaseQuotation = () =>
    useCreateUpdateService<PurchaseQuotationSaveResponsePayload, PurchaseQuotationVariables>({
        createUrl: endPoints.create.purchase_quotation,
        updateUrl: endPoints.update.purchase_quotation,
        schema: zPurchaseQuotationSaveResponsePayload,
    });

/* ================= Quotation Dropdowns ================= */
export const usePurchaseQuotationDropdowns = () =>
    useQuery<DropdownPayload>({
        queryKey: ['purchaseQuotationDropdowns'],
        queryFn: () =>
            getRequest(
                endPoints.drop_downs.purchase_quotation,
                zDropdownPayload
            ),
        retry: 2,
        refetchOnWindowFocus: false,
    });

/* ================= Quotation Item Variables ================= */
export interface QuotationItemVariables {
    prfq_item_id?: string;
    // ← removed requested_part_number_id from here
    is_no_quote?: boolean;
    // line item fields
    part_number_id?: string;
    requested_part_number_id?: string;  // ← moved here
    condition_id?: string;
    unit_of_measure_id?: string;
    qty?: number;
    price?: number;
    moq?: number;
    mov?: number;
    delivery_options?: string;
    remark?: string;
}

/* ================= Create Quotation Items ================= */
export interface CreateQuotationItemsVariables {
    quotation_id: string;
    items: QuotationItemVariables[];
}

export const useCreateQuotationItems = () =>
    useMutation<QuotationItemSaveResponsePayload, Error, CreateQuotationItemsVariables>(
        ({ quotation_id, items }) =>
            postRequest(
                endPoints.create.quotation_items.replace(':id', quotation_id),
                { items },
                zQuotationItemSaveResponsePayload,
            )
    );

/* ================= Quotation List ================= */
type UseQuotationListProps = {
    enabled?: boolean;
    queryParams?: QueryParams;
};

export const useQuotationList = ({
    enabled = true,
    queryParams,
}: UseQuotationListProps = {}) =>
    useQuery({
        queryKey: ['QuotationList', queryParams],
        queryFn: () =>
            getRequest(
                endPoints.list.purchase_quotation,
                zQuotationListPayload,
                queryParams
            ),
        retry: 2,
        refetchOnWindowFocus: false,
        enabled,
    });

/* ================= Quotation Items ================= */
type UseQuotationItemsProps = {
    enabled?: boolean;
    queryParams?: QueryParams;
};

export const useQuotationItems = (
    quotationId?: string,
    { enabled = true, queryParams }: UseQuotationItemsProps = {}
) =>
    useQuery<QuotationItemsPayload>({
        queryKey: ['quotationItems', quotationId, queryParams],
        queryFn: () =>
            getRequest(
                endPoints.list.quotation_items.replace(':id', String(quotationId)),
                zQuotationItemsPayload,
                queryParams
            ),
        enabled: !!quotationId && enabled,
        retry: 2,
        refetchOnWindowFocus: false,
    });

export const useUpdateQuotationItem = () =>
    useMutation<QuotationLineItemUpdateResponsePayload, Error, QuotationLineItemUpdateVariables>(
        ({ quotation_id, line_item_id, ...body }) =>
            putRequest(
                endPoints.update.quotation_line_item
                    .replace(':quotation', quotation_id)
                    .replace(':line_item', line_item_id),
                body,
                zQuotationLineItemUpdateResponsePayload,
            )
    );

/* ================= Quotations By RFQ ================= */
type UseQuotationsByRfqProps = {
    enabled?: boolean;
};

export const useQuotationsByRFQ = (
    rfqId?: string,
    { enabled = true }: UseQuotationsByRfqProps = {}
) =>
    useQuery<QuotationsByRfqPayload>({
        queryKey: ['quotationsByRfq', rfqId],
        queryFn: () =>
            getRequest(
                endPoints.list.quotation_by_rfq.replace(':id', String(rfqId)),
                zQuotationsByRfqPayload,
            ),
        enabled: !!rfqId && enabled,
        retry: 2,
        refetchOnWindowFocus: false,
    });
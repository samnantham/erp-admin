import { useQuery, UseQueryOptions } from 'react-query';
import { useCreateUpdateService } from '@/services/global-service';
import { getRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';
import { zDropdownPayload, DropdownPayload, QueryParams } from '@/services/global-schema';
import {
    PurchaseOrderDetailsPayload,
    PurchaseOrderSaveResponsePayload,
    zPurchaseOrderIndexPayload,
    zPurchaseOrderDetailsPayload,
    zPurchaseOrderSaveResponsePayload,
    zPurchaseOrderListPayload,
} from '@/services/purchase/order/schema';

/* ================= Purchase Order Index ================= */
export const usePurchaseOrderIndex = (queryParams?: QueryParams) =>
    useQuery({
        queryKey: ['purchaseOrderIndex', queryParams],
        queryFn: () =>
            getRequest(
                endPoints.index.purchase_order,
                zPurchaseOrderIndexPayload,
                queryParams
            ),
        retry: 2,
        refetchOnWindowFocus: false,
    });

/* ================= Purchase Order Details ================= */
export const usePurchaseOrderDetails = (
    id?: string,
    options?: UseQueryOptions<PurchaseOrderDetailsPayload>
) =>
    useQuery<PurchaseOrderDetailsPayload>({
        queryKey: ['purchaseOrderDetails', id],
        queryFn: () =>
            getRequest(
                endPoints.info.purchase_order.replace(':id', String(id)),
                zPurchaseOrderDetailsPayload
            ),
        enabled: !!id,
        retry: 2,
        refetchOnWindowFocus: false,
        ...options,
    });

/* ================= Purchase Order Variables ================= */
export interface PurchaseOrderVariables {
    id?: string;
    customer_contact_manager_id: string;
    priority_id: string;
    ship_customer_id?: string;
    customer_id?: string;
    ship_customer_shipping_address_id?: string;
    payment_mode_id: string;
    payment_term_id: string;
    fob_id: string;
    currency_id: string;
    ship_type_id: string;
    ship_mode_id: string;
    ship_account_id: string;
    remark?: string;
    bank_charge?: number;
    freight?: number;
    discount?: number;
    miscellaneous_charges?: number;
    vat?: number;
    is_closed?: boolean;
    is_editable?: boolean;
    update_request_status?: boolean;
}

/* ================= Create / Update Purchase Order ================= */
export const useSavePurchaseOrder = () =>
    useCreateUpdateService<PurchaseOrderSaveResponsePayload, PurchaseOrderVariables>({
        createUrl: endPoints.create.purchase_order,
        updateUrl: endPoints.update.purchase_order,
        schema: zPurchaseOrderSaveResponsePayload,
    });

/* ================= Purchase Order Item Variables ================= */
export interface PurchaseOrderItemVariables {
    id?: string;
    purchase_order_id: string;
    part_number_id: string;
    condition_id: string;
    unit_of_measure_id: string;
    quotation_item_id?: string;
    qty: number;
    price: number;
    note?: string;
    is_group?: boolean;
    is_closed?: boolean;
}

/* ================= Purchase Order Dropdowns ================= */
export const usePurchaseOrderDropdowns = () =>
    useQuery<DropdownPayload>({
        queryKey: ['purchaseOrderDropdowns'],
        queryFn: () =>
            getRequest(
                endPoints.drop_downs.purchase_order,
                zDropdownPayload
            ),
        retry: 2,
        refetchOnWindowFocus: false,
    });

/* ================= Purchase Order List ================= */
type UsePurchaseOrderListProps = {
    enabled?: boolean;
    queryParams?: QueryParams;
};

export const usePurchaseOrderList = ({
    enabled = true,
    queryParams,
}: UsePurchaseOrderListProps = {}) =>
    useQuery({
        queryKey: ['purchaseOrderList', queryParams],
        queryFn: () =>
            getRequest(
                endPoints.list.purchase_order,
                zPurchaseOrderListPayload,
                queryParams
            ),
        retry: 2,
        refetchOnWindowFocus: false,
        enabled,
    });
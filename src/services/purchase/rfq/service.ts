import { useMutation, useQuery, useQueryClient, UseQueryOptions } from 'react-query';
import { useCreateUpdateService } from '@/services/global-service';
import { getRequest, postRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';
import { zDropdownPayload, DropdownPayload, QueryParams } from '@/services/global-schema';
import {
    PRFQDetailsPayload,
    PRFQSaveResponsePayload,
    PRFQVendorsPayload,
    AddVendorToPRFQVariables,
    AddVendorToPRFQPayload,
    zPRFQIndexPayload,
    zPRFQDetailsPayload,
    zPRFQSaveResponsePayload,
    zPRFQVendorsPayload,
    zPRFQListPayload,
    zAddVendorToPRFQPayload,
} from '@/services/purchase/rfq/schema';

/* ================= PRFQ Index ================= */
export const usePRFQIndex = (queryParams?: QueryParams) =>
    useQuery({
        queryKey: ['prfqIndex', queryParams],
        queryFn: () =>
            getRequest(
                endPoints.index.prfq,
                zPRFQIndexPayload,
                queryParams
            ),
        retry: 2,
        refetchOnWindowFocus: false,
    });

/* ================= PRFQ Details ================= */
export const usePRFQDetails = (
    id?: string,
    options?: UseQueryOptions<PRFQDetailsPayload>
) =>
    useQuery<PRFQDetailsPayload>({
        queryKey: ['prfqDetails', id],
        queryFn: () =>
            getRequest(
                endPoints.info.prfq.replace(':id', String(id)),
                zPRFQDetailsPayload
            ),
        enabled: !!id,
        retry: 2,
        refetchOnWindowFocus: false,
        ...options,
    });

/* ================= PRFQ Vendors ================= */
export const usePRFQVendors = (
    id?: string,
    options?: UseQueryOptions<PRFQVendorsPayload>
) =>
    useQuery<PRFQVendorsPayload>({
        queryKey: ['prfqVendors', id],
        queryFn: () =>
            getRequest(
                endPoints.info.prfq.replace(':id', String(id)) + '/vendors',
                zPRFQVendorsPayload
            ),
        enabled: !!id,
        retry: 2,
        refetchOnWindowFocus: false,
        ...options,
    });

/* ================= Add Vendor to PRFQ ================= */
export const useSaveVendorToRFQ = () => {
    const queryClient = useQueryClient();

    return useMutation<AddVendorToPRFQPayload, Error, AddVendorToPRFQVariables>({
        mutationFn: ({ prfq_id, vendor_id, customer_contact_manager_id }) =>
            postRequest(
                endPoints.info.prfq.replace(':id', prfq_id) + '/vendors',
                { vendor_id, customer_contact_manager_id },
                zAddVendorToPRFQPayload
            ),
        onSuccess: (_data, variables) => {
            // Invalidate the vendors list so PRFQVendorsPopup re-fetches automatically
            queryClient.invalidateQueries(['prfqVendors', variables.prfq_id]);
        },
    });
};

/* ================= PRFQ Variables ================= */
export interface PRFQVariables {
    id?: string;
    need_by_date: string;
    remarks?: string;
    is_closed?: boolean;
    is_editable?: boolean;
    update_request_status?: boolean;
    priority_id: string;
    user_id: string;
}

/* ================= Create / Update PRFQ ================= */
export const useSavePRFQ = () =>
    useCreateUpdateService<PRFQSaveResponsePayload, PRFQVariables>({
        createUrl: endPoints.create.prfq,
        updateUrl: endPoints.update.prfq,
        schema: zPRFQSaveResponsePayload,
    });

/* ================= PRFQ Dropdowns ================= */
export const usePRFQDropdowns = () =>
    useQuery<DropdownPayload>({
        queryKey: ['prfqDropdowns'],
        queryFn: () =>
            getRequest(
                endPoints.drop_downs.prfq,
                zDropdownPayload
            ),
        retry: 2,
        refetchOnWindowFocus: false,
    });

/* ================= PRFQ List ================= */
type UsePRFQListProps = {
    enabled?: boolean;
    queryParams?: QueryParams;
};

export const usePRFQList = ({
    enabled = true,
    queryParams,
}: UsePRFQListProps = {}) =>
    useQuery({
        queryKey: ['rfqLogList', queryParams],
        queryFn: () =>
            getRequest(
                endPoints.list.prfq,
                zPRFQListPayload,
                queryParams
            ),
        retry: 2,
        refetchOnWindowFocus: false,
        enabled,
    });
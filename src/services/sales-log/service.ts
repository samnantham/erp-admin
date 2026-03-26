import { useQuery, UseQueryOptions } from 'react-query';
import { useCreateUpdateService } from '@/services/global-service';
import { getRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';
import { zDropdownPayload, DropdownPayload, QueryParams } from '@/services/global-schema';

import {
  SalesLogDetailsPayload,
  SalesLogSaveResponsePayload,
  zSalesLogIndexPayload,
  zSalesLogDetailsPayload,
  zSalesLogSaveResponsePayload,
  zSalesLogListPayload
} from '@/services/sales-log/schema';

/* ================= Sales Log Index ================= */

export const useSalesLogIndex = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ['salesLogIndex', queryParams],
    queryFn: () => getRequest(endPoints.index.sales_log, zSalesLogIndexPayload, queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Sales Log Details ================= */

export const useSalesLogDetails = (
  id?: string,
  options?: UseQueryOptions<SalesLogDetailsPayload>
) =>
  useQuery<SalesLogDetailsPayload>({
    queryKey: ['salesLogDetails', id],
    queryFn: () =>
      getRequest(
        endPoints.info.sales_log.replace(':id', String(id)),
        zSalesLogDetailsPayload
      ),
    enabled: !!id,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });

/* ================= Sales Log Variables ================= */

export interface SalesLogVariables {
  id?: string;
  cust_rfq_no: string;
  cust_rfq_date: string;
  due_date: string;
  remarks?: string;
  is_closed?: boolean;
  is_editable?: boolean;
  customer_id: string;
  mode_of_receipt_id: string;
  priority_id: string;
  customer_contact_manager_id: string;
  customer_shipping_address_id: string;
  currency_id: string;
  fob_id?: string;
  payment_mode_id?: string;
  payment_term_id?: string;
}

/* ================= Create / Update Sales Log ================= */

export const useSaveSalesLog = () =>
  useCreateUpdateService<SalesLogSaveResponsePayload, SalesLogVariables>({
    createUrl: endPoints.create.sales_log,
    updateUrl: endPoints.update.sales_log,
    schema: zSalesLogSaveResponsePayload,
  });

/* ================= Sales Log Dropdowns ================= */

export const useSalesLogDropdowns = () =>
  useQuery<DropdownPayload>({
    queryKey: ['salesLogDropdowns'],
    queryFn: () => getRequest(endPoints.drop_downs.sales_log, zDropdownPayload),
    retry: 2,
    refetchOnWindowFocus: false,
  });

type UseSalesLogListProps = {
  enabled?: boolean;
  queryParams?: QueryParams;
};

export const useSalesLogList = ({
  enabled = true,
  queryParams,
}: UseSalesLogListProps = {}) =>
  useQuery({
    queryKey: ['salesLogList', queryParams], // ✅ include params in cache key
    queryFn: () =>
      getRequest(
        endPoints.list.sales_log,
        zSalesLogListPayload,
        queryParams // ✅ pass params to API
      ),
    retry: 2,
    refetchOnWindowFocus: false,
    enabled,
  });

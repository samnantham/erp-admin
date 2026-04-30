import { useQuery, UseQueryOptions, UseMutationOptions } from "react-query";
import { useCreateUpdateService } from "@/services/global-service";
import { useApiMutation } from '@/api/hooks/useApiMutation';
import { getRequest, patchRequest } from "@/api/client";
import { endPoints } from "@/api/endpoints";
import { AxiosError } from "axios";
import { ApiResp, zDropdownPayload, DropdownPayload, QueryParams } from "@/services/global-schema";
import { z } from 'zod';

import {
  InvoiceDetailsPayload,
  InvoiceCreateResponse,
  ProformaInvoiceDetailsPayload,
  ProformaInvoiceCreateResponse,
  zInvoiceIndexPayload,
  zInvoiceDetailsPayload,
  zInvoiceCreateResponse,
  zInvoiceListPayload,
  zProformaInvoiceIndexPayload,
  zProformaInvoiceDetailsPayload,
  zProformaInvoiceCreateResponse,
  zProformaInvoiceListPayload,
} from "@/services/finance/invoice/schema";

/* =========================================================
   Shared Variable Types
========================================================= */

export interface InvoiceItemVariable {
  reference_item_id: string;
  pay_on_amount:     number;
  pay_on_qty:        number;
  remarks?:          string | null;
}

export interface AdditionalChargeVariable {
  charge_type_id: string;
  input_value:    number;
  remarks?:       string | null;
}

/* =========================================================
   Shared Zod schema for mark-ready responses
========================================================= */

const zMarkReadyResponse = z.object({
  status:  z.boolean(),
  message: z.string(),
  data:    z.any().optional(),
});

type MarkReadyResponse = z.infer<typeof zMarkReadyResponse>;

/* =========================================================
   Invoice
========================================================= */

type InvoiceIndexPayload  = z.infer<typeof zInvoiceIndexPayload>;
type ProformaIndexPayload = z.infer<typeof zProformaInvoiceIndexPayload>;

export const useInvoiceIndex = (
    queryParams?: QueryParams,
    options?: Omit<UseQueryOptions<InvoiceIndexPayload>, 'queryKey' | 'queryFn'>
) =>
    useQuery<InvoiceIndexPayload>({
        queryKey: ["invoiceIndex", queryParams],
        queryFn:  () => getRequest(endPoints.index.invoice, zInvoiceIndexPayload, queryParams),
        retry: 2,
        refetchOnWindowFocus: false,
        enabled: true,
        ...options,
    });

export const useInvoiceDetails = (
  id?: string,
  options?: UseQueryOptions<InvoiceDetailsPayload>
) =>
  useQuery<InvoiceDetailsPayload>({
    queryKey: ["invoiceDetails", id],
    queryFn:  () => getRequest(endPoints.info.invoice.replace(":id", String(id)), zInvoiceDetailsPayload),
    enabled:  !!id,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });

export interface InvoiceVariables {
  id?:                     string;
  reference_type?:         string;
  reference_id?:           string;
  customer_bank_id:        string;
  invoice_type:            string;
  payment_by:              string;
  payment_date:            string;
  due_date:                string;
  tax_invoice_no:          string;
  tax_invoice_date:        string;
  sub_total:               number;
  total_financial_charges: number;
  invoice_amount:          number;
  currency_id:             string;
  payment_term_id:         string;
  file?:                   string;
  remarks?:                string;
  is_ready_for_receipt?:   boolean;
  items?:                  InvoiceItemVariable[];
  financial_charges?:      AdditionalChargeVariable[];
}

export const useSaveInvoice = (
  options?: UseMutationOptions<InvoiceCreateResponse, AxiosError<ApiResp>, InvoiceVariables>
) =>
  useCreateUpdateService<InvoiceCreateResponse, InvoiceVariables>(
    {
      createUrl: endPoints.create.invoice,
      updateUrl: endPoints.update.invoice,
      schema:    zInvoiceCreateResponse(),
    },
    options
  );

export const useInvoiceList = ({
  enabled = true,
  queryParams,
}: { enabled?: boolean; queryParams?: QueryParams } = {}) =>
  useQuery({
    queryKey: ["invoiceList", queryParams],
    queryFn:  () => getRequest(endPoints.list.invoice, zInvoiceListPayload, queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
    enabled,
  });

export const useInvoiceDropdowns = () =>
  useQuery<DropdownPayload>({
    queryKey: ["invoiceDropdowns"],
    queryFn:  () => getRequest(endPoints.drop_downs.invoice, zDropdownPayload),
    retry: 2,
    refetchOnWindowFocus: false,
  });

// ── Mark invoice as ready for receipt ──
export const useMarkInvoiceReady = (
  options?: UseMutationOptions<MarkReadyResponse, AxiosError<ApiResp>, string>
) =>
  useApiMutation<MarkReadyResponse, string>(
    (id: any) => patchRequest(
      endPoints.others.mark_invoice_ready.replace(":id", id),
      {},
      zMarkReadyResponse
    ),
    options
  );

/* =========================================================
   Proforma Invoice
========================================================= */

export const useProformaInvoiceIndex = (
    queryParams?: QueryParams,
    options?: Omit<UseQueryOptions<ProformaIndexPayload>, 'queryKey' | 'queryFn'>
) =>
    useQuery<ProformaIndexPayload>({
        queryKey: ["proformaInvoiceIndex", queryParams],
        queryFn:  () => getRequest(endPoints.index.proforma_invoice, zProformaInvoiceIndexPayload, queryParams),
        retry: 2,
        refetchOnWindowFocus: false,
        enabled: true,
        ...options,
    });

export const useProformaInvoiceDetails = (
  id?: string,
  options?: UseQueryOptions<ProformaInvoiceDetailsPayload>
) =>
  useQuery<ProformaInvoiceDetailsPayload>({
    queryKey: ["proformaInvoiceDetails", id],
    queryFn:  () => getRequest(endPoints.info.proforma_invoice.replace(":id", String(id)), zProformaInvoiceDetailsPayload),
    enabled:  !!id,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });

export interface ProformaInvoiceVariables {
  id?:                     string;
  reference_type?:         string;
  reference_id?:           string;
  customer_bank_id:        string;
  date:                    string;
  payment_term_id:         string;
  invoice_number:          string;
  invoice_date:            string;
  sub_total:               number;
  total_financial_charges: number;
  invoice_amount:          number;
  file?:                   string;
  narration?:              string;
  is_ready_for_receipt?:   boolean;
  items?:                  InvoiceItemVariable[];
  financial_charges?:      AdditionalChargeVariable[];
}

export const useSaveProformaInvoice = (
  options?: UseMutationOptions<ProformaInvoiceCreateResponse, AxiosError<ApiResp>, ProformaInvoiceVariables>
) =>
  useCreateUpdateService<ProformaInvoiceCreateResponse, ProformaInvoiceVariables>(
    {
      createUrl: endPoints.create.proforma_invoice,
      updateUrl: endPoints.update.proforma_invoice,
      schema:    zProformaInvoiceCreateResponse(),
    },
    options
  );

// ── Mark proforma invoice as ready for receipt ──
export const useMarkProformaInvoiceReady = (
  options?: UseMutationOptions<MarkReadyResponse, AxiosError<ApiResp>, string>
) =>
  useApiMutation<MarkReadyResponse, string>(
    (id: any) => patchRequest(
      endPoints.others.mark_proforma_invoice_ready.replace(":id", id),
      {},
      zMarkReadyResponse
    ),
    options
  );

export const useProformaInvoiceList = ({
  enabled = true,
  queryParams,
}: { enabled?: boolean; queryParams?: QueryParams } = {}) =>
  useQuery({
    queryKey: ["proformaInvoiceList", queryParams],
    queryFn:  () => getRequest(endPoints.list.proforma_invoice, zProformaInvoiceListPayload, queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
    enabled,
  });

export const useProformaInvoiceDropdowns = () =>
  useQuery<DropdownPayload>({
    queryKey: ["proformaInvoiceDropdowns"],
    queryFn:  () => getRequest(endPoints.drop_downs.proforma_invoice, zDropdownPayload),
    retry: 2,
    refetchOnWindowFocus: false,
  });

export const useItemTransactions = (
    referenceItemId?: string,
    options?: UseQueryOptions<any>
) =>
    useQuery({
        queryKey: ["itemTransactions", referenceItemId],
        queryFn:  () => getRequest(
            endPoints.others.finance_item_transactions.replace(":id", referenceItemId!),
            z.object({ status: z.boolean(), data: z.array(z.any()) })
        ),
        enabled: !!referenceItemId,
        retry: 2,
        refetchOnWindowFocus: false,
        ...options,
    });
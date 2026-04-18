import { useQuery, UseQueryOptions, UseMutationOptions } from "react-query";
import { useCreateUpdateService } from "@/services/global-service";
import { getRequest } from "@/api/client";
import { endPoints } from "@/api/endpoints";
import { AxiosError } from "axios";
import { ApiResp, zDropdownPayload, DropdownPayload, QueryParams } from "@/services/global-schema";

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
   Shared Item Types
========================================================= */

export interface InvoiceItemVariable {
  reference_item_id: string;
  modified_price?: number | null;
  is_finalized: boolean;
  remarks?: string | null;
}

export interface AdditionalChargeVariable {
  charge_type_id: string;
  amount: number;
  remarks?: string | null;
}

/* =========================================================
   Invoice
========================================================= */

export const useInvoiceIndex = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ["invoiceIndex", queryParams],
    queryFn: () =>
      getRequest(endPoints.index.invoice, zInvoiceIndexPayload, queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
  });

export const useInvoiceDetails = (
  id?: string,
  options?: UseQueryOptions<InvoiceDetailsPayload>
) =>
  useQuery<InvoiceDetailsPayload>({
    queryKey: ["invoiceDetails", id],
    queryFn: () =>
      getRequest(
        endPoints.info.invoice.replace(":id", String(id)),
        zInvoiceDetailsPayload
      ),
    enabled: !!id,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });

export interface InvoiceVariables {
  id?: string;
  code: string;
  reference_type?: string;
  reference_id?: string;
  customer_bank_id: string;
  invoice_type: string;
  payment_by: string;
  payment_date: string;
  due_date: string;
  tax_invoice_no: string;
  tax_invoice_date: string;
  invoice_amount: number;
  currency_id: string;
  payment_term_id: string;
  file?: string;
  remarks?: string;
  items?: InvoiceItemVariable[];
  additional_charges?: AdditionalChargeVariable[];
}

export const useSaveInvoice = (
  options?: UseMutationOptions<InvoiceCreateResponse, AxiosError<ApiResp>, InvoiceVariables>
) =>
  useCreateUpdateService<InvoiceCreateResponse, InvoiceVariables>(
    {
      createUrl: endPoints.create.invoice,
      updateUrl: endPoints.update.invoice,
      schema: zInvoiceCreateResponse(),
    },
    options
  );

export const useInvoiceList = ({
  enabled = true,
  queryParams,
}: { enabled?: boolean; queryParams?: QueryParams } = {}) =>
  useQuery({
    queryKey: ["invoiceList", queryParams],
    queryFn: () =>
      getRequest(endPoints.list.invoice, zInvoiceListPayload, queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
    enabled,
  });

export const useInvoiceDropdowns = () =>
  useQuery<DropdownPayload>({
    queryKey: ["invoiceDropdowns"],
    queryFn: () =>
      getRequest(endPoints.drop_downs.invoice, zDropdownPayload),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* =========================================================
   Proforma Invoice
========================================================= */

export const useProformaInvoiceIndex = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ["proformaInvoiceIndex", queryParams],
    queryFn: () =>
      getRequest(endPoints.index.proforma_invoice, zProformaInvoiceIndexPayload, queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
  });

export const useProformaInvoiceDetails = (
  id?: string,
  options?: UseQueryOptions<ProformaInvoiceDetailsPayload>
) =>
  useQuery<ProformaInvoiceDetailsPayload>({
    queryKey: ["proformaInvoiceDetails", id],
    queryFn: () =>
      getRequest(
        endPoints.info.proforma_invoice.replace(":id", String(id)),
        zProformaInvoiceDetailsPayload
      ),
    enabled: !!id,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });

export interface ProformaInvoiceVariables {
  id?: string;
  code: string;
  reference_type?: string;
  reference_id?: string;
  customer_bank_id: string;
  date: string;
  payment_term_id: string;
  invoice_number: string;
  invoice_date: string;
  invoice_amount: number;
  file?: string;
  narration?: string;
  items?: InvoiceItemVariable[];
  additional_charges?: AdditionalChargeVariable[];
}

export const useSaveProformaInvoice = (
  options?: UseMutationOptions<ProformaInvoiceCreateResponse, AxiosError<ApiResp>, ProformaInvoiceVariables>
) =>
  useCreateUpdateService<ProformaInvoiceCreateResponse, ProformaInvoiceVariables>(
    {
      createUrl: endPoints.create.proforma_invoice,
      updateUrl: endPoints.update.proforma_invoice,
      schema: zProformaInvoiceCreateResponse(),
    },
    options
  );

export const useProformaInvoiceList = ({
  enabled = true,
  queryParams,
}: { enabled?: boolean; queryParams?: QueryParams } = {}) =>
  useQuery({
    queryKey: ["proformaInvoiceList", queryParams],
    queryFn: () =>
      getRequest(endPoints.list.proforma_invoice, zProformaInvoiceListPayload, queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
    enabled,
  });

export const useProformaInvoiceDropdowns = () =>
  useQuery<DropdownPayload>({
    queryKey: ["proformaInvoiceDropdowns"],
    queryFn: () =>
      getRequest(endPoints.drop_downs.proforma_invoice, zDropdownPayload),
    retry: 2,
    refetchOnWindowFocus: false,
  });
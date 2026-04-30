import { useQuery, UseQueryOptions, UseMutationOptions } from "react-query";
import { useCreateUpdateService } from "@/services/global-service";
import { getRequest } from "@/api/client";
import { endPoints } from "@/api/endpoints";
import { AxiosError } from "axios";
import { ApiResp, QueryParams, zDropdownPayload, DropdownPayload } from "@/services/global-schema";

import {
  PaymentReceiptDetailsPayload,
  PaymentReceiptCreateResponse,
  zPaymentReceiptIndexPayload,
  zPaymentReceiptDetailsPayload,
  zPaymentReceiptCreateResponse,
  zPaymentReceiptListPayload,
} from "@/services/finance/payment-receipt/schema";

/* =========================================================
   Payment Receipt Index
========================================================= */

export const usePaymentReceiptIndex = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ["paymentReceiptIndex", queryParams],
    queryFn: () => getRequest(endPoints.index.payment_receipt, zPaymentReceiptIndexPayload, queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* =========================================================
   Payment Receipt Details
========================================================= */

export const usePaymentReceiptDetails = (
  id?: string,
  options?: UseQueryOptions<PaymentReceiptDetailsPayload>
) =>
  useQuery<PaymentReceiptDetailsPayload>({
    queryKey: ["paymentReceiptDetails", id],
    queryFn: () => getRequest(
      endPoints.info.payment_receipt.replace(":id", String(id)),
      zPaymentReceiptDetailsPayload
    ),
    enabled: !!id,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });

/* =========================================================
   Payment Receipt Variables
========================================================= */

export interface PaymentReceiptVariables {
  id?: string;
  type: 'credit' | 'debit';
  refer_type: 'po' | 'rpo' | 'lo' | 'so' | 'ro';
  reference_type: 'invoice' | 'proforma' | 'return_order';   // ← replaces invoice_id / proforma_invoice_id
  reference_id: string;      
  order_reference_id: string;
  payment_via_id: string;             // ← replaces invoice_id / proforma_invoice_id
  customer_bank_id: string;
  payment_mode_id: string;
  bank_receipt_number?: string;
  payment_value: number;
  payment_receipt_file?: string;
  payment_date: string;
  remarks?: string;                   // ← new
}

/* =========================================================
   Create / Update Payment Receipt
========================================================= */

export const useSavePaymentReceipt = (
  options?: UseMutationOptions<PaymentReceiptCreateResponse, AxiosError<ApiResp>, PaymentReceiptVariables>
) =>
  useCreateUpdateService<PaymentReceiptCreateResponse, PaymentReceiptVariables>(
    {
      createUrl: endPoints.create.payment_receipt,
      updateUrl: endPoints.update.payment_receipt,
      schema: zPaymentReceiptCreateResponse(),
    },
    options
  );

/* =========================================================
   Payment Receipt List
========================================================= */

export const usePaymentReceiptList = ({
  enabled = true,
  queryParams,
}: { enabled?: boolean; queryParams?: QueryParams } = {}) =>
  useQuery({
    queryKey: ["paymentReceiptList", queryParams],
    queryFn: () => getRequest(endPoints.list.payment_receipt, zPaymentReceiptListPayload, queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
    enabled,
  });

/* =========================================================
   Payment Receipt Dropdowns
========================================================= */

export const usePaymentReceiptDropdowns = () =>
  useQuery<DropdownPayload>({
    queryKey: ["paymentReceiptDropdowns"],
    queryFn: () => getRequest(endPoints.drop_downs.payment_receipt, zDropdownPayload),
    retry: 2,
    refetchOnWindowFocus: false,
  });
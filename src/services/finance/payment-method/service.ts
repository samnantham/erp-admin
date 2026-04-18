import { useQuery, UseQueryOptions } from "react-query";
import { UseMutationOptions } from "react-query";
import { AxiosError } from "axios";

import { getRequest } from "@/api/client";
import { endPoints } from "@/api/endpoints";
import { useCreateUpdateService } from "@/services/global-service";
import { ApiResp, zDropdownPayload, DropdownPayload } from "@/services/global-schema";

import {
  zFinanceBank,
  zFinanceCard,
  zFinanceCheque,
  zFinanceBankDetailsPayload,
  zFinanceCardDetailsPayload,
  zFinanceChequeDetailsPayload,
  zFinanceBankCreateResponse,
  zFinanceCardCreateResponse,
  zFinanceChequeCreateResponse,
  FinanceBankCreateResponse,
  FinanceCardCreateResponse,
  FinanceChequeCreateResponse,
} from "@/services/finance/payment-method/schema";
import { z } from "zod";


/* =========================================================
   Schema Maps
========================================================= */

const zBankIndex   = z.object({ data: z.array(zFinanceBank),   status: z.boolean() });
const zCardIndex   = z.object({ data: z.array(zFinanceCard),   status: z.boolean() });
const zChequeIndex = z.object({ data: z.array(zFinanceCheque), status: z.boolean() });

const INDEX_SCHEMA_MAP: Record<string, z.ZodTypeAny> = {
  banks:   zBankIndex,
  cards:   zCardIndex,
  cheques: zChequeIndex,
};

const DETAILS_SCHEMA_MAP: Record<string, z.ZodTypeAny> = {
  banks:   zFinanceBankDetailsPayload,
  cards:   zFinanceCardDetailsPayload,
  cheques: zFinanceChequeDetailsPayload,
};

export type PaymentMethod = "banks" | "cards" | "cheques";


/* =========================================================
   Index
========================================================= */

export const usePaymentMethodIndex = (
  method?: PaymentMethod,
  options?: UseQueryOptions<any>
) =>
  useQuery({
    queryKey: ["paymentMethodIndex", method],
    queryFn: () => {
      const schema = INDEX_SCHEMA_MAP[method!];
      return getRequest(
        endPoints.index.payment_methods.replace(":method", method!),
        schema
      );
    },
    enabled: !!method,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });


/* =========================================================
   Details
========================================================= */

export const usePaymentMethodDetails = (
  method?: PaymentMethod,
  id?: string,
  options?: UseQueryOptions<any>
) =>
  useQuery({
    queryKey: ["paymentMethodDetails", method, id],
    queryFn: () => {
      const schema = DETAILS_SCHEMA_MAP[method!];
      return getRequest(
        endPoints.info.payment_methods
          .replace(":method", method!)
          .replace(":id", String(id)),
        schema
      );
    },
    enabled: !!method && !!id,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });


/* =========================================================
   Variables
========================================================= */

export interface FinanceBankVariables {
  id?:             string;
  name:            string;
  account_label:   string;
  branch:          string;
  address_line1:   string;
  address_line2?:  string;
  ac_iban_no:      string;
  type_of_ac:      string;
  swift:           string;
  aba_routing_no?: string;
  ifsc_code?:      string;
  contact_name:    string;
  phone?:          string;
  fax?:            string;
  mobile?:         string;
  email?:          string;
  currency:        string;
  is_default:      boolean;
  is_active:       boolean;
}

export interface FinanceCardVariables {
  id?:               string;
  card_label:        string;
  card_holder_name:  string;
  card_type:         string;
  card_category:     string;
  card_last4:        string;
  expiry_month:      string;
  expiry_year:       string;
  bank_name:         string;
  address_line1?:    string;
  address_line2?:    string;
  contact_name:      string;
  phone?:            string;
  mobile?:           string;
  email?:            string;
  currency:          string;
  is_default:        boolean;
  is_active:         boolean;
}

export interface FinanceChequeVariables {
  id?:             string;
  name:            string;
  account_label:   string;
  branch:          string;
  address_line1:   string;
  address_line2?:  string;
  ac_no:           string;
  type_of_ac:      string;
  aba_routing_no?: string;
  ifsc_code?:      string;
  micr_code?:      string;
  contact_name:    string;
  phone?:          string;
  fax?:            string;
  mobile?:         string;
  email?:          string;
  currency:        string;
  is_default:      boolean;
  is_active:       boolean;
}


/* =========================================================
   Create / Update
========================================================= */

export const useSaveFinanceBank = (
  options?: UseMutationOptions<FinanceBankCreateResponse, AxiosError<ApiResp>, FinanceBankVariables>
) =>
  useCreateUpdateService<FinanceBankCreateResponse, FinanceBankVariables>(
    {
      createUrl: endPoints.create.payment_methods.replace(":method", "banks"),
      updateUrl: endPoints.update.payment_methods.replace(":method", "banks"),
      schema:    zFinanceBankCreateResponse(),
    },
    options
  );

export const useSaveFinanceCard = (
  options?: UseMutationOptions<FinanceCardCreateResponse, AxiosError<ApiResp>, FinanceCardVariables>
) =>
  useCreateUpdateService<FinanceCardCreateResponse, FinanceCardVariables>(
    {
      createUrl: endPoints.create.payment_methods.replace(":method", "cards"),
      updateUrl: endPoints.update.payment_methods.replace(":method", "cards"),
      schema:    zFinanceCardCreateResponse(),
    },
    options
  );

export const useSaveFinanceCheque = (
  options?: UseMutationOptions<FinanceChequeCreateResponse, AxiosError<ApiResp>, FinanceChequeVariables>
) =>
  useCreateUpdateService<FinanceChequeCreateResponse, FinanceChequeVariables>(
    {
      createUrl: endPoints.create.payment_methods.replace(":method", "cheques"),
      updateUrl: endPoints.update.payment_methods.replace(":method", "cheques"),
      schema:    zFinanceChequeCreateResponse(),
    },
    options
  );


  
  /* =========================================================
     Payment Receipt Dropdowns
  ========================================================= */
  
  export const usePaymentMethodDropdowns = () =>
    useQuery<DropdownPayload>({
      queryKey: ["paymentReceiptDropdowns"],
      queryFn: () =>
        getRequest(endPoints.drop_downs.payment_method, zDropdownPayload),
      retry: 2,
      refetchOnWindowFocus: false,
    });

import { useQuery, UseQueryOptions } from "react-query";
import { useCreateUpdateService } from "@/services/global-service";
import { getRequest, putRequest } from "@/api/client";
import { endPoints } from "@/api/endpoints";
import { useApiMutation } from "@/api/hooks/useApiMutation";
import { UseMutationOptions } from "react-query";
import { AxiosError } from "axios";
import { ApiResp } from "@/services/global-service";

import {
  zDropdownPayload,
  DropdownPayload,
  QueryParams
} from "@/services/global-schema";

import {
  CustomerDetailsPayload,
  zCreateResponsePayload,
  zCustomerIndexPayload,
  zCustomerDetailsPayload,
  CreateResponsePayload,
} from "@/services/master/customer/schema";

/* ================= Customer Index ================= */

export const useCustomerIndex = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ["customerIndex", queryParams],
    queryFn: () =>
      getRequest(
        endPoints.index.customer,
        zCustomerIndexPayload,
        queryParams
      ),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Customer Details ================= */

export const useCustomerDetails = (
  id?: number | string,
  options?: UseQueryOptions<CustomerDetailsPayload>
) =>
  useQuery<CustomerDetailsPayload>({
    queryKey: ["customerDetails", id],
    queryFn: () =>
      getRequest(
        endPoints.info.customer.replace(":id", String(id)),
        zCustomerDetailsPayload
      ),
    enabled: !!id,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });

/* ================= Customer Variables ================= */

export interface CustomerVariables {
  id?: number | string;

  business_name: string;
  code: string;
  email: string;

  business_type_id: string;
  contact_type_id: string;
  currency_id: string;

  payment_mode_id: string;
  payment_term_id: string;

  nature_of_business: string;
  remarks?: string;

  total_credit_amount?: number;
  total_credit_period?: number;

  year_of_business: number;

  is_foreign_entity: boolean;

  license_trade_no?: string;
  license_trade_exp_date?: string;
  license_trade_url?: string;

  vat_tax_id?: string;
  vat_tax_url?: string;
}

/* ================= Create / Update Customer ================= */

export const useSaveCustomer = () =>
  useCreateUpdateService<
    CreateResponsePayload,
    CustomerVariables
  >({
    createUrl: endPoints.create.customer,
    updateUrl: endPoints.update.customer,
    schema: zCreateResponsePayload,
  });

  interface CustomerStatusVariables {
  id: string | number;
  customer_status_id: string;
  reason?: string;
}

export const useUpdateCustomerStatus = () =>
  useApiMutation<CreateResponsePayload, CustomerStatusVariables>(
    ({ id, ...rest }) =>
      putRequest(
        endPoints.others.customer_status_update.replace(":id", String(id)),
        rest,
        zCreateResponsePayload
      )
  );

/* ================= Create / Update Contact Manager ================= */

export const useSaveContactManager = (
  options?: UseMutationOptions<any, AxiosError<ApiResp>, any>
) =>
  useCreateUpdateService(
    {
      createUrl: endPoints.create.contact_manager,
      updateUrl: endPoints.update.contact_manager,
      schema: zCreateResponsePayload,
    },
    options
  );

/* ================= Create / Update Shipping Address ================= */

export const useSaveShippingAddress = (
  options?: UseMutationOptions<any, AxiosError<ApiResp>, any>
) =>
  useCreateUpdateService(
    {
      createUrl: endPoints.create.shipping_address,
      updateUrl: endPoints.update.shipping_address,
      schema: zCreateResponsePayload,
    },
    options
  );

/* ================= Create / Update BANK ================= */

export const useSaveBank = (
  options?: UseMutationOptions<any, AxiosError<ApiResp>, any>
) =>
  useCreateUpdateService(
    {
      createUrl: endPoints.create.bank,
      updateUrl: endPoints.update.bank,
      schema: zCreateResponsePayload,
    },
    options
  );

  /* ================= Create / Update Principle Of Owner ================= */

export const useSavePrincipleOwner = (
  options?: UseMutationOptions<any, AxiosError<ApiResp>, any>
) =>
  useCreateUpdateService(
    {
      createUrl: endPoints.create.principle_of_owner,
      updateUrl: endPoints.update.principle_of_owner,
      schema: zCreateResponsePayload,
    },
    options
  );

    /* ================= Create / Update Trader Reference ================= */

export const useSaveTraderReference = (
  options?: UseMutationOptions<any, AxiosError<ApiResp>, any>
) =>
  useCreateUpdateService(
    {
      createUrl: endPoints.create.trader_reference,
      updateUrl: endPoints.update.trader_reference,
      schema: zCreateResponsePayload,
    },
    options
  );



/* ================= Customer Dropdowns ================= */

export const useCustomerDropdowns = () =>
  useQuery<DropdownPayload>({
    queryKey: ["customerDropdowns"],
    queryFn: () =>
      getRequest(
        endPoints.drop_downs.customer,
        zDropdownPayload
      ),
    retry: 2,
    refetchOnWindowFocus: false,
  });
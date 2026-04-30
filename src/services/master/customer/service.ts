import { z } from "zod";
import { useMemo } from "react";
import { useQuery, UseQueryOptions } from "react-query";
import { useCreateUpdateService } from "@/services/global-service";
import { getRequest, putRequest, postRequest } from "@/api/client";
import { endPoints } from "@/api/endpoints";
import { useApiMutation } from "@/api/hooks/useApiMutation";
import { useBulkUpload } from "@/api/hooks/useBulkUpload";
import { UseMutationOptions } from "react-query";
import { AxiosError } from "axios";
import { ApiResp } from "@/services/global-schema";

import {
  zDropdownPayload,
  DropdownPayload,
  QueryParams,
} from "@/services/global-schema";

import {
  CustomerDetailsPayload,
  CreateResponsePayload,
  CustomerBulkUploadResponse,
  RelationBulkUploadResponse,
  BulkCustomerUniqueCheckPayload,
  RelationUniqueCheckPayload,
  zCustomerCreateResponse,
  zCustomerIndexPayload,
  zCustomerDetailsPayload,
  zBulkCustomerUploadResponse,
  zRelationBulkUploadResponse,
  zBulkCustomerUniqueCheckPayload,
  zRelationUniqueCheckPayload,
  zCreateResponsePayload,
  zCustomerListPayload,
  BankCreateResponse,
  ContactManagerCreateResponse,
  ShippingAddressCreateResponse,
  PrincipleOwnerCreateResponse,
  TraderReferenceCreateResponse,
  zBankCreateResponse,
  zContactManagerCreateResponse,
  zShippingAddressCreateResponse,
  zPrincipleOwnerCreateResponse,
  zTraderReferenceCreateResponse,
  ContactGroupDetailsPayload,
  ContactGroupCreateResponse,
  zContactGroupIndexPayload,
  zContactGroupDetailsPayload,
  zContactGroupCreateResponse,
  zContactGroupListPayload,
  zContactGroupMembersPayload
} from "@/services/master/customer/schema";

/* ================= Customer Index ================= */

export const useCustomerIndex = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ["customerIndex", queryParams],
    queryFn: () =>
      getRequest(endPoints.index.customer, zCustomerIndexPayload, queryParams),
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

export const useSaveCustomer = (
  options?: UseMutationOptions<CreateResponsePayload, AxiosError<ApiResp>, CustomerVariables>
) =>
  useCreateUpdateService<CreateResponsePayload, CustomerVariables>(
    {
      createUrl: endPoints.create.customer,
      updateUrl: endPoints.update.customer,
      schema: zCustomerCreateResponse(),
    },
    options
  );

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

// Typed: onSuccess(response) → response.data is CustomerContactManager
export const useSaveContactManager = (
  options?: UseMutationOptions<ContactManagerCreateResponse, AxiosError<ApiResp>, any>
) =>
  useCreateUpdateService<ContactManagerCreateResponse, any>(
    {
      createUrl: endPoints.create.contact_manager,
      updateUrl: endPoints.update.contact_manager,
      schema: zContactManagerCreateResponse(),
    },
    options
  );

/* ================= Create / Update Shipping Address ================= */

// Typed: onSuccess(response) → response.data is CustomerShippingAddress
export const useSaveShippingAddress = (
  options?: UseMutationOptions<ShippingAddressCreateResponse, AxiosError<ApiResp>, any>
) =>
  useCreateUpdateService<ShippingAddressCreateResponse, any>(
    {
      createUrl: endPoints.create.shipping_address,
      updateUrl: endPoints.update.shipping_address,
      schema: zShippingAddressCreateResponse(),
    },
    options
  );

/* ================= Create / Update Bank ================= */

// Typed: onSuccess(response) → response.data is CustomerBank
export const useSaveBank = (
  options?: UseMutationOptions<BankCreateResponse, AxiosError<ApiResp>, any>
) =>
  useCreateUpdateService<BankCreateResponse, any>(
    {
      createUrl: endPoints.create.bank,
      updateUrl: endPoints.update.bank,
      schema: zBankCreateResponse(),
    },
    options
  );

/* ================= Create / Update Principle Of Owner ================= */

// Typed: onSuccess(response) → response.data is CustomerPrincipleOwner
export const useSavePrincipleOwner = (
  options?: UseMutationOptions<PrincipleOwnerCreateResponse, AxiosError<ApiResp>, any>
) =>
  useCreateUpdateService<PrincipleOwnerCreateResponse, any>(
    {
      createUrl: endPoints.create.principle_of_owner,
      updateUrl: endPoints.update.principle_of_owner,
      schema: zPrincipleOwnerCreateResponse(),
    },
    options
  );

/* ================= Create / Update Trader Reference ================= */

// Typed: onSuccess(response) → response.data is CustomerTraderReference
export const useSaveTraderReference = (
  options?: UseMutationOptions<TraderReferenceCreateResponse, AxiosError<ApiResp>, any>
) =>
  useCreateUpdateService<TraderReferenceCreateResponse, any>(
    {
      createUrl: endPoints.create.trader_reference,
      updateUrl: endPoints.update.trader_reference,
      schema: zTraderReferenceCreateResponse(),
    },
    options
  );

/* ================= Customer Dropdowns ================= */

export const useCustomerDropdowns = () =>
  useQuery<DropdownPayload>({
    queryKey: ["customerDropdowns"],
    queryFn: () =>
      getRequest(endPoints.drop_downs.customer, zDropdownPayload),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Customer — Unique Check ================= */

export interface CustomerUniqueCheckRow {
  business_name: string;
  email: string;
}

export interface UploadedCustomerUniqueCheckPayload {
  rows: CustomerUniqueCheckRow[];
}

export const useCheckExistingUniqueCustomers = () =>
  useApiMutation<BulkCustomerUniqueCheckPayload, UploadedCustomerUniqueCheckPayload>(
    (payload) =>
      postRequest(
        endPoints.others.check_existing_unique_customers,
        payload,
        zBulkCustomerUniqueCheckPayload()
      )
  );

/* ================= Customer — Bulk Upload ================= */

export interface BulkCustomerUploadPayload {
  rows: CustomerVariables[];
}

export const useBulkUploadCustomers = () =>
  useBulkUpload<CustomerBulkUploadResponse, BulkCustomerUploadPayload>(
    endPoints.bulk_upload.customer,
    zBulkCustomerUploadResponse()
  );

/* ================= Relation — Unique Check (Generic) ================= */

export interface RelationUniqueCheckPayloadRequest {
  rows: Record<string, string>[];
}

export const useCheckRelationExists = (url: string) =>
  useApiMutation<RelationUniqueCheckPayload, RelationUniqueCheckPayloadRequest>(
    (payload) =>
      postRequest(url, payload, zRelationUniqueCheckPayload())
  );

/* ================= Relation — Bulk Upload (Generic) ================= */

export interface RelationBulkUploadPayload {
  rows: any[];
}

export const useRelationBulkUpload = (url: string) =>
  useBulkUpload<RelationBulkUploadResponse, RelationBulkUploadPayload>(
    url,
    zRelationBulkUploadResponse()
  );

/* ================= Relation — Get All (Generic) ================= */

const zRelationIndexPayload = z.object({
  data: z.array(z.any()),
  status: z.boolean(),
});

export const useCustomerRelationIndex = (
  customerId?: string,
  relation?: string,
  options?: UseQueryOptions<any>
) =>
  useQuery({
    queryKey: ["customerRelation", customerId, relation],
    queryFn: () =>
      getRequest(
        endPoints.index.customer_relation
          .replace(":customer_id", String(customerId))
          .replace(":relation", String(relation)),
        zRelationIndexPayload
      ),
    enabled: !!customerId && !!relation,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });

type UseCustomerListProps = {
  enabled?: boolean;
  contact_type_id?: string | string[];
  queryParams?: QueryParams;
};

export const useCustomerList = ({
    enabled = true,
    contact_type_id,
    queryParams,
}: UseCustomerListProps = {}) => {

    const normalizedContactTypeIds = contact_type_id
        ? Array.isArray(contact_type_id)
            ? contact_type_id
            : [contact_type_id]
        : undefined;

    // ✅ Memoize so the object reference only changes when values actually change
    const finalParams = useMemo(() => ({
        ...queryParams,
        contact_type_id: normalizedContactTypeIds,
    }), [JSON.stringify(queryParams), JSON.stringify(normalizedContactTypeIds)]);

    return useQuery({
        queryKey: ['customerList', finalParams],
        queryFn: () => getRequest(endPoints.list.customer, zCustomerListPayload, finalParams),
        retry: 2,
        refetchOnWindowFocus: false,
        enabled,
    });
};
export const getCustomerById = (id: string) =>
  getRequest(
    endPoints.info.customer.replace(":id", id),
    zCustomerDetailsPayload
  ).then(res => res?.data ?? res);

export const getCustomerRelations = (id: string, relation: string) =>
  getRequest(
    endPoints.index.customer_relation
      .replace(":customer_id", String(id))
      .replace(":relation", String(relation)),
    zRelationIndexPayload
  ).then(res => res?.data ?? res);

  /* ================= Contact Group Index ================= */

export const useContactGroupIndex = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ["contactGroupIndex", queryParams],
    queryFn: () =>
      getRequest(endPoints.index.contact_group, zContactGroupIndexPayload, queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Contact Group Details ================= */

export const useContactGroupDetails = (
  id?: number | string,
  options?: UseQueryOptions<ContactGroupDetailsPayload>
) =>
  useQuery<ContactGroupDetailsPayload>({
    queryKey: ["contactGroupDetails", id],
    queryFn: () =>
      getRequest(
        endPoints.info.contact_group.replace(":id", String(id)),
        zContactGroupDetailsPayload
      ),
    enabled: !!id,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });

/* ================= Contact Group Variables ================= */

export interface ContactGroupMemberVariable {
  contact_id: string;
}

export interface ContactGroupVariables {
  id?: number | string;
  name: string;
  contact_type_id?: string;
  members?: ContactGroupMemberVariable[];
}

/* ================= Create / Update Contact Group ================= */

export const useSaveContactGroup = (
  options?: UseMutationOptions<ContactGroupCreateResponse, AxiosError<ApiResp>, ContactGroupVariables>
) =>
  useCreateUpdateService<ContactGroupCreateResponse, ContactGroupVariables>(
    {
      createUrl: endPoints.create.contact_group,
      updateUrl: endPoints.update.contact_group,
      schema: zContactGroupCreateResponse(),
    },
    options
  );

/* ================= Contact Group List ================= */

export const useContactGroupList = ({
  enabled = true,
  queryParams,
}: UseCustomerListProps = {}) =>
  useQuery({
    queryKey: ["contactGroupList", queryParams],
    queryFn: () =>
      getRequest(
        endPoints.list.contact_group,
        zContactGroupListPayload,
        queryParams
      ),
    retry: 2,
    refetchOnWindowFocus: false,
    enabled,
  });

  /* ================= Contact Group Members ================= */

type UseContactGroupMembersProps = {
  groupId?: string;
  contact_type_ids?: string[];
  enabled?: boolean;
};

export const useContactGroupMembers = ({
  groupId,
  contact_type_ids,
  enabled = true,
}: UseContactGroupMembersProps) =>
  useQuery({
    queryKey: ["contactGroupMembers", groupId, contact_type_ids],
    queryFn: () =>
      getRequest(
        endPoints.others.contact_group_members.replace(":id", String(groupId)),
        zContactGroupMembersPayload,
        {
          ...(contact_type_ids?.length
            ? { contact_type_id: contact_type_ids.join(",") }
            : {}),
        }
      ),
    enabled: !!groupId && enabled,
    retry: 2,
    refetchOnWindowFocus: false,
  });
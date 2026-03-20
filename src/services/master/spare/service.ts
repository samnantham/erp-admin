import { useQuery, UseQueryOptions, useQueryClient } from 'react-query';
import { useCreateUpdateService } from '@/services/global-service';
import { getRequest, postRequest } from '@/api/client';
import { endPoints } from '@/api/endpoints';
import { zDropdownPayload, DropdownPayload, QueryParams } from '@/services/global-schema';
import { useApiMutation } from '@/api/hooks/useApiMutation';
import { useBulkUpload } from '@/api/hooks/useBulkUpload';
import {
  AssignAltSpareRespPayload,
  PartNumberDetailsPayload,
  PartNumberSaveResponsePayload,
  PartNumberBulkUploadResponse,
  PartNumberUniqueCheckPayload,
  zPartNumberIndexPayload,
  zPartNumberDetailsPayload,
  zPartNumberSaveResponsePayload,
  zPartNumberBulkUploadResponse,
  zPartNumberUniqueCheckPayload,
  zSearchPartNumberPayload,
  zSpareDetailsPayload,
  zAssignAltSparePartsRespPayload
} from '@/services/master/spare/schema';

/* ================= Part Number Index ================= */
export const usePartNumberIndex = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ['partNumberIndex', queryParams],
    queryFn: () => getRequest(endPoints.index.spare, zPartNumberIndexPayload, queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Part Number Details ================= */
export const usePartNumberDetails = (
  id?: string,
  options?: UseQueryOptions<PartNumberDetailsPayload>
) =>
  useQuery<PartNumberDetailsPayload>({
    queryKey: ['partNumberDetails', id],
    queryFn: () =>
      getRequest(
        endPoints.info.spare.replace(':id', String(id)),
        zPartNumberDetailsPayload
      ),
    enabled: !!id,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });

/* ================= Part Number Variables ================= */
export interface PartNumberVariables {
  id?: string;
  name: string;
  description: string;
  manufacturer_name?: string;
  cage_code?: string;
  ata?: string;
  is_shelf_life: boolean;
  is_serialized: boolean;
  total_shelf_life?: number | null;
  is_llp: boolean;
  is_dg: boolean;
  msds?: string;
  ipc_ref?: string;
  picture?: string;
  xref?: string;
  remarks?: string;
  unit_of_measure_id: string;
  spare_type_id: string;
  spare_model_id?: string;
  hsc_code_id: string;
  un_id?: string | null;
}

/* ================= Create / Update Part Number ================= */
export const useSavePartNumber = () =>
  useCreateUpdateService<PartNumberSaveResponsePayload, PartNumberVariables>({
    createUrl: endPoints.create.spare,
    updateUrl: endPoints.update.spare,
    schema: zPartNumberSaveResponsePayload,
  });

/* ================= Part Number Dropdowns ================= */
export const usePartNumberDropdowns = () =>
  useQuery<DropdownPayload>({
    queryKey: ['partNumberDropdowns'],
    queryFn: () => getRequest(endPoints.drop_downs.spare, zDropdownPayload),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Part Number — Unique Check ================= */
export interface PartNumberUniqueCheckRow {
  name: string;
}
export interface PartNumberUniqueCheckPayloadRequest {
  rows: PartNumberUniqueCheckRow[];
}
export const useCheckExistingUniquePartNumbers = () =>
  useApiMutation<PartNumberUniqueCheckPayload, PartNumberUniqueCheckPayloadRequest>(
    (payload) =>
      postRequest(
        endPoints.others.check_existing_unique_spares,
        payload,
        zPartNumberUniqueCheckPayload()
      )
  );

/* ================= Part Number — Bulk Upload ================= */
export interface BulkPartNumberUploadPayload {
  rows: PartNumberVariables[];
}
export const useBulkUploadPartNumbers = () =>
  useBulkUpload<PartNumberBulkUploadResponse, BulkPartNumberUploadPayload>(
    endPoints.bulk_upload.spare,
    zPartNumberBulkUploadResponse()
  );

/* ================= Part Number — Search ================= */
export const useSearchPartNumber = (queryParams?: QueryParams) =>
  useQuery({
    queryKey: ['searchPartNumber', queryParams],
    queryFn: () => getRequest(endPoints.search.spare, zSearchPartNumberPayload(), queryParams),
    retry: 2,
    refetchOnWindowFocus: false,
  });

/* ================= Spare — Fetch Details (Imperative) ================= */
export const fetchSpareDetails = () => {
  const queryClient = useQueryClient();

  return async (id: number | string) => {
    if (!id || id === 0 || id === '0') return null;

    return queryClient.fetchQuery({
      queryKey: ['SpareDetails', id],
      queryFn: () =>
        getRequest(
          endPoints.info.spare.replace(':id', String(id)),
          zSpareDetailsPayload()
        ),
    });
  };
};

type useCreateAltSpareBody = {
  part_number_id: string;
  alternate_part_number_id: string;
  remark: string;
  alt_ref_doc?: string;
  is_deleted?: boolean;
};
type useCreateAltSparePartsBody = useCreateAltSpareBody[];

export const useAssignAltParts = () => {
  const queryClient = useQueryClient();
  return useApiMutation<AssignAltSpareRespPayload, useCreateAltSparePartsBody>(
    (payload) =>
      postRequest(
        endPoints.others.create_alternate_spares,
        payload,
        zAssignAltSparePartsRespPayload()
      ),
    {
      onSuccess: (data) => {
        if (data.status) {
          queryClient.invalidateQueries('spareList');
          queryClient.invalidateQueries('spareIndex');
        }
      },
    }
  );
};
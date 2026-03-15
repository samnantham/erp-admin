import {
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "react-query";

import { getRequest, putRequest } from "@/api/client";
import { endPoints } from "@/api/endpoints";
import { useApiMutation } from '@/api/hooks/useApiMutation';
import {
  ApprovalLogHistoryPayload,
  ApprovalLogPayload,
  ApprovalActionPayload,
  DashboardPayload,
  zApprovalActionPayload,
  zApprovalLogPayload,
  zApprovalLogHistoryPayload,
  zDashboardPayload,
  
} from "@/services/update-delete-requests/schema";

// ─── Query params ─────────────────────────────────────────────────────────────

export interface ApprovalQueryParams {
  page?: number;
  limit?: number;
  status?: "pending" | "approved" | "rejected";
}

export interface ApprovalLogParams {
  model: string;
  action: "update" | "delete";
}

export interface ProcessRequestVariables {
  change_id: string;
  action: "approve" | "reject";
  reason?: string;
}

/* ================= Dashboard ================= */

export const useApprovalsDashboard = (
  options?: UseQueryOptions<DashboardPayload>
) =>
  useQuery<DashboardPayload>({
    queryKey: ["approvalsDashboard"],
    queryFn: () =>
      getRequest(
        endPoints.others.update_delete_request_dashboard,
        zDashboardPayload
      ),
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });

/* ================= Approval Log Index ================= */

export const useApprovalLogIndex = (
  { model, action }: ApprovalLogParams,
  queryParams?: ApprovalQueryParams,
  options?: UseQueryOptions<ApprovalLogPayload>
) =>
  useQuery<ApprovalLogPayload>({
    queryKey: ["approvalLogIndex", model, action, queryParams],
    queryFn: () =>
      getRequest(
        endPoints.index.update_delete_request
          .replace(":model", model)
          .replace(":action", action),
        zApprovalLogPayload,
        queryParams
      ),
    enabled: !!model && !!action,
    retry: 2,
    refetchOnWindowFocus: false,
    ...options,
  });

  // In /services/update-delete-requests/service.ts

// ── add this alongside useApprovalLogIndex ──
// service.ts

export const useApprovalLogHistory = (
    recordId: string | null,
    options?: UseQueryOptions<ApprovalLogHistoryPayload>
) =>
    useQuery<ApprovalLogHistoryPayload>({
        queryKey: ["approvalLogHistory", recordId],
        queryFn: () =>
            getRequest(
                endPoints.others.update_delete_request_history
                    .replace(":record_id", recordId!),
                zApprovalLogHistoryPayload
            ),
        enabled: !!recordId,
        retry: 2,
        refetchOnWindowFocus: false,
        ...options,
    });

/* ================= Process Request (Approve / Reject) ================= */

export const useProcessRequest = () => {
  const queryClient = useQueryClient();

  return useApiMutation<ApprovalActionPayload, ProcessRequestVariables>(
    ({ change_id, action, reason }) =>
      putRequest(
        endPoints.others.process_request
          .replace(":change_id", change_id)
          .replace(":action", action),
        { reason },
        zApprovalActionPayload
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["approvalLogIndex"]);
        queryClient.invalidateQueries(["approvalsDashboard"]);
      },
    }
  );
};

/* ================= Invalidate helpers ================= */

export const useInvalidateApprovals = () => {
  const queryClient = useQueryClient();

  return {
    invalidateDashboard: () =>
      queryClient.invalidateQueries(["approvalsDashboard"]),

    invalidateLog: (model: string) =>
      queryClient.invalidateQueries(["approvalLogIndex", model]),

    invalidateAll: () => {
      queryClient.invalidateQueries(["approvalsDashboard"]);
      queryClient.invalidateQueries(["approvalLogIndex"]);
    },
  };
};
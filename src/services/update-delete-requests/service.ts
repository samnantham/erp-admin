import { useQuery, useQueryClient, UseQueryOptions } from "react-query";

import { getRequest } from "@/api/client";
import { endPoints } from "@/api/endpoints";

import {
  zDashboardPayload,
  zApprovalLogPayload,
  DashboardPayload,
  ApprovalLogPayload
} from "@/services/update-delete-requests/schema";

// ─── Query params ─────────────────────────────────────────────────────────────

export interface ApprovalQueryParams {
  page?: number;
  limit?: number;
  status?: "pending" | "approved" | "rejected";
  action?: "update" | "delete" | "create";
}

export interface ApprovalLogParams {
  model: string;
  action: "update" | "delete";
}


export interface ApprovalActionVariables {
  id: string;
  reason?: string;
}

/* ================= Dashboard ================= */

export const useApprovalsDashboard = (
  options?: UseQueryOptions<DashboardPayload>
) =>
  useQuery<DashboardPayload>({
    queryKey: ["approvalsDashboard"],
    queryFn: () =>
      getRequest(endPoints.others.update_delete_request_dashboard, zDashboardPayload),
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
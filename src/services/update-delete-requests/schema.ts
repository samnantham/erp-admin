import { z } from "zod";
import { zPagination } from "@/services/global-schema";

// ─── Approval counts ──────────────────────────────────────────────────────────

export const zApprovalCounts = z.object({
  approved: z.number(),
  pending: z.number(),
  rejected: z.number(),
  total: z.number(),
});

// ─── Module approval (dashboard row) ─────────────────────────────────────────

export const zModuleApproval = z.object({
  module: z.string(),
  value: z.string(),
  has_link: z.boolean(),
  link: z.string().optional().nullable(),
  update: zApprovalCounts,
  delete: zApprovalCounts,
});

// ─── Overall stats ────────────────────────────────────────────────────────────

export const zOverallStats = z.object({
  update: zApprovalCounts,
  delete: zApprovalCounts,
});

// ─── Approval log entry ───────────────────────────────────────────────────────
// new_data / old_data / record are model-specific.
// Will be replaced with a discriminated union once per-model samples are ready.

export const zApprovalLogEntry = z.object({
  id: z.string().uuid(),
  action: z.enum(["update", "delete", "create"]),
  model_name: z.string(),
  record_id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"]),
  new_data: z.record(z.unknown()),
  old_data: z.record(z.unknown()),
  record: z.record(z.unknown()),
  approved_by: z.string().uuid().nullable(),
  requested_by: z.string().uuid(),
  reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
});

// ─── Dashboard payload ────────────────────────────────────────────────────────

export const zDashboardPayload = z.object({
  data: z.array(zModuleApproval),
  overall: zOverallStats,
  status: z.boolean(),
  total_modules: z.number(),
});

// ─── Approval log index payload ───────────────────────────────────────────────

export const zApprovalLogPayload = z.object({
  data: z.array(zApprovalLogEntry),
  pagination: zPagination.optional(),
});

// ─── Approval log details payload ─────────────────────────────────────────────

export const zApprovalLogDetailsPayload = z.object({
  data: zApprovalLogEntry,
  status: z.boolean(),
});

// ─── Approve / reject action payload ─────────────────────────────────────────

export const zApprovalActionPayload = z.object({
  status: z.boolean(),
  message: z.string().optional(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ApprovalCounts        = z.infer<typeof zApprovalCounts>;
export type ModuleApproval        = z.infer<typeof zModuleApproval>;
export type OverallStats          = z.infer<typeof zOverallStats>;
export type ApprovalLogEntry      = z.infer<typeof zApprovalLogEntry>;
export type DashboardPayload      = z.infer<typeof zDashboardPayload>;
export type ApprovalLogPayload    = z.infer<typeof zApprovalLogPayload>;
export type ApprovalLogDetailsPayload = z.infer<typeof zApprovalLogDetailsPayload>;
export type ApprovalActionPayload = z.infer<typeof zApprovalActionPayload>;
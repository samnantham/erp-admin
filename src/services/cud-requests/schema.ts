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
  create: zApprovalCounts.optional(),           // ← only present for purchase
});

// ─── Overall stats ────────────────────────────────────────────────────────────

export const zOverallStats = z.object({
  update: zApprovalCounts,
  delete: zApprovalCounts,
  create: zApprovalCounts.optional(),           // ← accumulated from create modules
});

// ─── Approval log entry ───────────────────────────────────────────────────────

export const zApprovalLogEntry = z.object({
  id: z.string().uuid(),
  action: z.enum(["update", "delete", "create"]),
  model_name: z.string(),
  record_id: z
    .string()
    .transform((val) => (val === "" || val === "None" ? null : val))
    .pipe(z.string().uuid().nullable())
    .optional(),
  status: z.enum(["pending", "approved", "rejected"]),
  new_data: z.record(z.unknown()).nullable(),
  old_data: z.record(z.unknown()).nullable(),
  raw_new_data: z.record(z.unknown()).nullable().optional(),
  record: z.record(z.unknown()),
  approved_by: z.string().nullable(),
  requested_by: z.string().nullable(),
  reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
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

// ─── Approval log history ─────────────────────────────────────────────────────

export const zApprovalLogHistoryItem = z.object({
  id: z.string(),
  record_id: z
    .string()
    .transform((val) => (val === "" || val === "None" ? null : val))
    .pipe(z.string().uuid().nullable())
    .optional(),
  model_name: z.string(),
  action: z.enum(["create", "update", "delete"]),
  status: z.enum(["pending", "approved", "rejected"]),
  record: z.record(z.any()).nullable().optional(),
  old_data: z.record(z.any()).nullable().optional(),
  new_data: z.record(z.any()).nullable().optional(),
  raw_new_data: z.record(z.unknown()).nullable().optional(),
  raw_old_data: z.record(z.unknown()).nullable().optional(),
  requested_by: z.string().nullable().optional(),
  approved_by: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
});

export const zApprovalLogHistoryPayload = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.array(zApprovalLogHistoryItem),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ApprovalCounts             = z.infer<typeof zApprovalCounts>;
export type ModuleApproval             = z.infer<typeof zModuleApproval>;
export type OverallStats               = z.infer<typeof zOverallStats>;
export type ApprovalLogEntry           = z.infer<typeof zApprovalLogEntry>;
export type DashboardPayload           = z.infer<typeof zDashboardPayload>;
export type ApprovalLogPayload         = z.infer<typeof zApprovalLogPayload>;
export type ApprovalLogDetailsPayload  = z.infer<typeof zApprovalLogDetailsPayload>;
export type ApprovalActionPayload      = z.infer<typeof zApprovalActionPayload>;
export type ApprovalLogHistoryItem     = z.infer<typeof zApprovalLogHistoryItem>;
export type ApprovalLogHistoryPayload  = z.infer<typeof zApprovalLogHistoryPayload>;
import { ReactNode } from 'react';

/* =========================
   Display props
========================= */

type PreviewConfig = {
  enabled?: boolean;
  getOldPreviewUrl?: (row: any) => string;
  getNewPreviewRequest?: (row: any) => {
    url: string;
    method?: "POST";
    body: any;
  };
};

export type DisplayPropBase = {
  label: string;
  key: string;
  showInTable?: boolean;
  renderAs?: "text" | "doc" | "date" | "boolean";
  
  getValue?: (record: Record<string, unknown>) => unknown;
  valueResolver?: (args: {
    current: Record<string, unknown>;
    updated: Record<string, unknown>;
  }) => { previous: unknown; value: unknown };
  render?: (args: {
    value: unknown;
    previous: unknown;
    updated: Record<string, unknown>;
    current: Record<string, unknown>;
    field: DisplayPropBase;
    changed: boolean;
  }) => ReactNode;
  isEqualOverride?: (a: unknown, b: unknown) => boolean;
};

export type ArrayColumn = {
  key: string;
  label: string;
  renderAs?: "doc" | "boolean" | "date";
};

export type DisplayProp =
  | (DisplayPropBase & { kind?: 'scalar' })
  | (DisplayPropBase & {
      kind: 'array';
      columns?: ArrayColumn[];
      rowKey?: string;
      emptyText?: string;
    });

/* =========================
   View Actions
========================= */

type ModalPayload<T> = { parentId: string; existValues: T };

export type ModalType =
  | 'contact_manager'
  | 'customer_principle_owner'
  | 'customer_shipping_address'
  | 'customer_trader_references'
  | 'customer_bank';

export type ViewAction<T = any> =
  | { type: 'navigate'; url: string, state?: Record<string, unknown> }
  | { type: 'pdf'; title: string; url: string }
  | { [M in ModalType]: { type: M; payload: ModalPayload<T> } }[ModalType];

/* =========================
   Module Config
========================= */

export interface ModuleConfig<T = any> {
  value: string;
  label: string;
  displayProps: DisplayProp[];
  getViewAction?: (row: T) => ViewAction<T> | null;
  preview?: PreviewConfig;
  allowDelete?: boolean;
}
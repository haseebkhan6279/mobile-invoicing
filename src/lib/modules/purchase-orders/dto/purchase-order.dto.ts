export type PoLineInput = {
  productName: string;
  color?: string | null;
  network?: string | null;
  grade?: string | null;
  qty: number;
  unitCostGbp?: number;
  unitCostEur?: number;
};

export type CreatePurchaseOrderInput = {
  supplierId: string;
  status?: string;
  notes?: string | null;
  shippingCostGbp?: number;
  shippingCostEur?: number;
  fxRate?: number;
  lines: PoLineInput[];
};

export type UpdatePurchaseOrderMetaInput = {
  status?: string;
  notes?: string | null;
  shippingCostGbp?: number;
  shippingCostEur?: number;
  actualCostGbp?: number;
  actualCostEur?: number;
  fxRate?: number;
};

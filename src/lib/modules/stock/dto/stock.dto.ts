export type StockBatchInput = {
  productName: string;
  brand?: string | null;
  color?: string | null;
  network?: string | null;
  grade?: string | null;
  costGbp?: number;
  costEur?: number;
  imeis: string[];
};

export type ReceiveStockInput = {
  supplierId?: string | null;
  purchaseOrderId?: string | null;
  postLedger?: boolean;
  batches: StockBatchInput[];
};

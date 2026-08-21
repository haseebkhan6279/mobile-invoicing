export type InvoiceLineInput = {
  productName: string;
  color?: string | null;
  network?: string | null;
  grade?: string | null;
  qty: number;
  unitPriceGbp?: number;
  unitPriceEur?: number;
  imeis: string[];
};

export type CreateInvoiceInput = {
  customerId: string;
  status?: string;
  fxRate?: number;
  shippingCostGbp?: number;
  shippingCostEur?: number;
  shippingLabel?: string | null;
  paymentTerms?: string | null;
  warrantyTerms?: string | null;
  notes?: string | null;
  lines: InvoiceLineInput[];
};

export type CreateRmaInput = {
  invoiceId: string;
  reason?: string | null;
  notes?: string | null;
  items: { stockUnitId: string; action?: string; reason?: string | null }[];
};

export type ApplyRmaCreditInput = {
  paymentType?: string;
  appliedInvoiceId?: string | null;
  paymentAmountGbp?: number;
  paymentAmountEur?: number;
  paymentDate?: string | null;
};

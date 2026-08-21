export type ShipmentInput = {
  invoiceId?: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  shippingCostGbp?: number;
  shippingCostEur?: number;
  actualCostGbp?: number;
  actualCostEur?: number;
  status?: string;
  notes?: string | null;
};

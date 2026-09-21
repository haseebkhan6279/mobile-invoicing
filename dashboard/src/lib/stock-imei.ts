export type StockImeiLookup = {
  id: string;
  imei: string;
  productName: string;
  brand: string | null;
  color: string;
  network: string;
  grade: string;
  costGbp: number;
  status: string;
  notes: string | null;
  supplierName: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
};

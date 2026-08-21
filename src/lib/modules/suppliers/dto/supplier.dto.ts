export type SupplierInput = {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  vatNumber?: string | null;
  notes?: string | null;
};

export type LedgerEntryInput = {
  type?: string;
  amountGbp: number;
  amountEur: number;
  date?: string | null;
  reference?: string | null;
  notes?: string | null;
};

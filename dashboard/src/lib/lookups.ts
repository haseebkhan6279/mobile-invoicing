import { apiClient } from "@/lib/api-client";

export type Grade = { id: string; code: string; label: string; sortOrder: number };
export type Color = { id: string; name: string };
export type Network = { id: string; name: string };
export type SupplierLookup = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  vatNumber: string | null;
  notes: string | null;
};
export type CustomerLookup = {
  id: string;
  clientId: string;
  name: string;
  businessName: string | null;
  phone: string | null;
  email: string | null;
  vatNumber: string | null;
  address: string | null;
  shippingAddress: string | null;
  notes: string | null;
};

export type Lookups = {
  grades: Grade[];
  colors: Color[];
  networks: Network[];
  suppliers: SupplierLookup[];
  customers: CustomerLookup[];
};

export function getLookups(token?: string | null) {
  return apiClient.get<Lookups>("/lookups", token);
}

export function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function toOptionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

export function toOptionalNumber(value: FormDataEntryValue | null) {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

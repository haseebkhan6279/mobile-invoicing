"use server";

import { requireUser } from "@/lib/auth-guard";
import { apiClient } from "@/lib/api-client";

export type SearchResults = {
  stock: { imei: string; productName: string; grade: string; color: string; network: string; status: string }[];
  invoices: { id: string; invoiceNumber: string; status: string; customer: { clientId: string; name: string } }[];
  customers: { id: string; clientId: string; name: string; phone: string | null; email: string | null; businessName: string | null }[];
  purchaseOrders: { id: string; poNumber: string; status: string; supplier: { name: string } }[];
  rmas: { id: string; rmaNumber: string; status: string; invoice: { invoiceNumber: string }; customer: { name: string } }[];
  shipments: { id: string; shipmentNumber: string; status: string; trackingNumber: string | null; carrier: string | null; invoice: { invoiceNumber: string } }[];
  suppliers: { id: string; name: string; phone: string | null; email: string | null }[];
};

export async function globalSearch(query: string) {
  const { apiToken } = await requireUser();
  const params = new URLSearchParams({ q: query });
  return apiClient.get<SearchResults>(`/search?${params}`, apiToken);
}

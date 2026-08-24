import { notFound } from "next/navigation";
import { CurrencyPrintControls } from "@/components/currency-print-controls";
import { InvoiceDocument, type InvoiceDoc } from "@/components/invoice-document";
import { PrintButton } from "@/components/print-button";
import { requireUser } from "@/lib/auth-guard";
import { apiClient, ApiError } from "@/lib/api-client";
import type { BankCurrency } from "@/lib/company";

export default async function InvoicePrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ currency?: string; rate?: string }>;
}) {
  const { apiToken } = await requireUser();
  const { id } = await params;
  const { currency: currencyParam, rate: rateParam } = await searchParams;
  let invoice: InvoiceDoc;
  try {
    invoice = await apiClient.get<InvoiceDoc>(`/invoices/${id}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const defaultCurrency: BankCurrency = invoice.entity === "NI" ? "EUR" : "GBP";
  const currency = currencyParam === "EUR" || currencyParam === "GBP" ? currencyParam : defaultCurrency;
  const rate = Number(rateParam) || invoice.fxRate;

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-end gap-3">
        <PrintButton />
        <CurrencyPrintControls defaultCurrency={defaultCurrency} defaultRate={invoice.fxRate} />
      </div>
      <InvoiceDocument invoice={invoice} currency={currency} rate={rate} />
    </div>
  );
}

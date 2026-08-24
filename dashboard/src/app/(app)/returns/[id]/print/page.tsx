import { notFound } from "next/navigation";
import { CreditNoteDocument, type CreditNoteDoc } from "@/components/credit-note-document";
import { CurrencyPrintControls } from "@/components/currency-print-controls";
import { PrintButton } from "@/components/print-button";
import { requireUser } from "@/lib/auth-guard";
import { apiClient, ApiError } from "@/lib/api-client";
import type { BankCurrency } from "@/lib/company";
import { DEFAULT_FX_RATE } from "@/lib/money";

export default async function RmaPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ currency?: string; rate?: string }>;
}) {
  const { apiToken } = await requireUser();
  const { id } = await params;
  const { currency: currencyParam, rate: rateParam } = await searchParams;
  let rma: CreditNoteDoc;
  try {
    rma = await apiClient.get<CreditNoteDoc>(`/rma/${id}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const defaultCurrency: BankCurrency = rma.invoice.entity === "NI" ? "EUR" : "GBP";
  const currency = currencyParam === "EUR" || currencyParam === "GBP" ? currencyParam : defaultCurrency;
  const rate = Number(rateParam) || DEFAULT_FX_RATE;

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-end gap-3">
        <PrintButton />
        <CurrencyPrintControls defaultCurrency={defaultCurrency} defaultRate={DEFAULT_FX_RATE} />
      </div>
      <CreditNoteDocument rma={rma} currency={currency} rate={rate} />
    </div>
  );
}

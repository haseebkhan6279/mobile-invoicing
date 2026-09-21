import { notFound } from "next/navigation";
import { CreditNoteDocument, type CreditNoteDoc } from "@/components/credit-note-document";
import { CurrencyPrintControls } from "@/components/currency-print-controls";
import { PrintButton } from "@/components/print-button";
import { requireUser } from "@/lib/auth-guard";
import { apiClient, ApiError } from "@/lib/api-client";
import { DEFAULT_GBP_TO_EUR_RATE, type PrintCurrency } from "@/lib/money";

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
  const printPath = `/returns/${id}/print`;
  let rma: CreditNoteDoc;
  try {
    rma = await apiClient.get<CreditNoteDoc>(`/rma/${id}`, apiToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const issuedCurrency: PrintCurrency = rma.invoice.printCurrency === "EUR" ? "EUR" : "GBP";
  const issuedRate =
    rma.invoice.fxRate && rma.invoice.fxRate > 0 ? rma.invoice.fxRate : DEFAULT_GBP_TO_EUR_RATE;
  const currency: PrintCurrency = currencyParam
    ? currencyParam === "EUR"
      ? "EUR"
      : "GBP"
    : issuedCurrency;
  const rate = Number(rateParam) > 0 ? Number(rateParam) : issuedRate;

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-end gap-3">
        <PrintButton>Print credit note</PrintButton>
        <CurrencyPrintControls currency={currency} rate={rate} basePath={printPath} />
      </div>
      <CreditNoteDocument rma={rma} currency={currency} rate={rate} />
    </div>
  );
}

import { addressLines, companyForEntity } from "@/lib/company";
import { invoiceTotals } from "@/lib/invoice";
import { formatEur, formatGbp } from "@/lib/money";
import { INVOICE_INVALID_UNTIL_PAID_NOTICE, INVOICE_MARGIN_NOTICE, INVOICE_TERMS } from "@/lib/terms";
import { formatDate } from "@/lib/utils";
import { labelStatus } from "@/lib/status";

export type InvoiceDoc = {
  invoiceNumber: string;
  entity: string;
  status: string;
  issuedAt: Date | string;
  fxRate: number;
  shippingCostGbp: number;
  shippingCostEur: number;
  shippingLabel: string | null;
  paymentTerms: string | null;
  warrantyTerms: string | null;
  paidAmountGbp: number;
  paidAmountEur: number;
  notes: string | null;
  customer: {
    clientId: string;
    name: string;
    businessName: string | null;
    phone: string | null;
    email: string | null;
    vatNumber: string | null;
    address: string | null;
    shippingAddress: string | null;
  };
  lines: {
    id: string;
    qty: number;
    productName: string;
    color: string;
    network: string;
    grade: string;
    unitPriceGbp: number;
    unitPriceEur: number;
    imeis?: string[];
  }[];
  stockUnits: { imei: string; invoiceLineId: string | null }[];
};

export function InvoiceDocument({ invoice }: { invoice: InvoiceDoc }) {
  const totals = invoiceTotals(invoice);
  const hasShipping = invoice.shippingCostGbp > 0 || invoice.shippingCostEur > 0;
  const company = companyForEntity(invoice.entity);
  const money = (gbp: number, eur: number) =>
    invoice.entity === "NI" ? formatEur(eur) : formatGbp(gbp);

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-8 text-slate-900 print:p-0">
      <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:justify-between">
        <div>
          <div className="text-xs font-semibold tracking-[0.25em] text-sky-700">
            {company.shortName}
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{company.tradingName}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {addressLines(company).join(", ")}
            <br />
            Telephone: {company.phoneDisplay} · Whatsapp: {company.whatsappDisplay}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold">INVOICE</div>
          <div className="mt-2 font-mono text-lg">Invoice No. {invoice.invoiceNumber}</div>
          <div className="text-sm text-slate-600">Order No. {invoice.invoiceNumber}</div>
          <div className="text-sm text-slate-600">Invoice Date {formatDate(invoice.issuedAt)}</div>
          <div className="text-sm text-slate-600">Order Date {formatDate(invoice.issuedAt)}</div>
          <div className="mt-2 text-sm font-medium">Invoice Status: {labelStatus(invoice.status)}</div>
          <div className="text-sm text-slate-600">Client ID: {invoice.customer.clientId}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Billing details</div>
          <div className="mt-1 font-medium">{invoice.customer.name}</div>
          {invoice.customer.businessName ? (
            <div>{invoice.customer.businessName}</div>
          ) : null}
          <div className="text-sm text-slate-600">
            {invoice.customer.address ? <div>{invoice.customer.address}</div> : null}
            {invoice.customer.phone ? <div>{invoice.customer.phone}</div> : null}
            {invoice.customer.email ? <div>{invoice.customer.email}</div> : null}
            {invoice.customer.vatNumber ? <div>VAT Number: {invoice.customer.vatNumber}</div> : null}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Shipping details</div>
          <div className="mt-1 font-medium">{invoice.customer.name}</div>
          {invoice.customer.businessName ? (
            <div>{invoice.customer.businessName}</div>
          ) : null}
          <div className="text-sm text-slate-600">
            {invoice.customer.shippingAddress || invoice.customer.address || "—"}
          </div>
        </div>
        <div className="text-sm text-slate-600">
          <div>FX rate: 1 GBP = {invoice.fxRate} EUR</div>
          <div>Payment Terms: {invoice.paymentTerms || "Immediate"}</div>
          <div>Warranty Terms: {invoice.warrantyTerms || "3 months"}</div>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-y border-slate-300 text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-2">Qty</th>
            <th className="py-2 pr-2">Product name</th>
            <th className="py-2 pr-2">Color</th>
            <th className="py-2 pr-2">Network</th>
            <th className="py-2 pr-2">Grade</th>
            <th className="py-2 pr-2 text-right">Unit price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.id} className="border-b border-slate-100">
              <td className="py-2 pr-2">{line.qty}</td>
              <td className="py-2 pr-2">{line.productName}</td>
              <td className="py-2 pr-2">{line.color}</td>
              <td className="py-2 pr-2">{line.network}</td>
              <td className="py-2 pr-2">{line.grade}</td>
              <td className="py-2 pr-2 text-right tabular-nums">
                {money(line.unitPriceGbp, line.unitPriceEur)}
              </td>
              <td className="py-2 text-right tabular-nums">
                {money(line.qty * line.unitPriceGbp, line.qty * line.unitPriceEur)}
              </td>
            </tr>
          ))}
          {hasShipping ? (
            <tr className="border-b border-slate-100">
              <td className="py-2 pr-2">1</td>
              <td className="py-2 pr-2" colSpan={4}>
                {invoice.shippingLabel || "Shipping"}
              </td>
              <td className="py-2 pr-2 text-right tabular-nums">
                {money(invoice.shippingCostGbp, invoice.shippingCostEur)}
              </td>
              <td className="py-2 text-right tabular-nums">
                {money(invoice.shippingCostGbp, invoice.shippingCostEur)}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      </div>

      {(() => {
        const allImeis = Array.from(
          new Set([
            ...invoice.stockUnits.map((unit) => unit.imei),
            ...invoice.lines.flatMap((line) => line.imeis ?? []),
          ]),
        );
        return allImeis.length ? (
          <div className="mt-4 text-xs text-slate-500">IMEIs: {allImeis.join(", ")}</div>
        ) : null;
      })()}

      <div className="mt-6 flex flex-wrap justify-between gap-6">
        <div className="max-w-sm text-sm text-slate-600">
          <div className="text-xs uppercase tracking-wide text-slate-500">Bank details</div>
          <div>Bank Name: {company.bank.bankName}</div>
          <div>Account Name: {company.bank.accountName}</div>
          <div>Sort code: {company.bank.sortCode}</div>
          <div>Account: {company.bank.accountNumber}</div>
          <div className="mt-2">
            Payment Reference: {invoice.invoiceNumber}
            <br />
            You must enter {invoice.invoiceNumber} as your payment reference.
          </div>
        </div>
        <div className="ml-auto w-full max-w-sm text-sm">
          <div className="flex justify-between py-1">
            <span>Subtotal</span>
            <span>{money(totals.subGbp, totals.subEur)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Shipping</span>
            <span>{money(totals.shippingGbp, totals.shippingEur)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-300 py-2 text-base font-semibold">
            <span>Grand Total</span>
            <span>{money(totals.totalGbp, totals.totalEur)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Payment Due</span>
            <span>{money(totals.dueGbp, totals.dueEur)}</span>
          </div>
        </div>
      </div>

      {invoice.notes ? (
        <p className="mt-8 text-sm text-slate-600">Notes: {invoice.notes}</p>
      ) : null}

      <p className="mt-6 text-xs text-slate-500">{INVOICE_INVALID_UNTIL_PAID_NOTICE}</p>

      <div className="print-page-break mt-8 border-t border-slate-200 pt-8 text-xs text-slate-600">
        <h2 className="text-sm font-semibold text-slate-900">Invoice Notes</h2>
        <p className="mt-2">{INVOICE_MARGIN_NOTICE}</p>
        <p className="mt-4">
          Please read our terms before making the payment. By making payment you agree to below
          terms applied to sold stock on above invoice.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          {INVOICE_TERMS.map((term, index) => (
            <li key={index}>{term}</li>
          ))}
        </ol>
        <p className="mt-6">
          Company Registration number: {company.companyNo}
          <br />
          Company VAT Number: {company.vatNumber}
        </p>
      </div>
    </div>
  );
}

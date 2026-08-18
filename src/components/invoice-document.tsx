import { company, companyAddressLines } from "@/lib/company";
import { invoiceTotals } from "@/lib/invoice";
import { formatEur, formatGbp } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { labelStatus } from "@/lib/status";

type InvoiceDoc = {
  invoiceNumber: string;
  status: string;
  issuedAt: Date;
  fxRate: number;
  shippingCostGbp: number;
  shippingCostEur: number;
  notes: string | null;
  customer: {
    clientId: string;
    name: string;
    businessName: string | null;
    phone: string | null;
    email: string | null;
    vatNumber: string | null;
    address: string | null;
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
  }[];
  stockUnits: { imei: string; invoiceLineId: string | null }[];
};

export function InvoiceDocument({ invoice }: { invoice: InvoiceDoc }) {
  const totals = invoiceTotals(invoice);
  return (
    <div className="mx-auto max-w-[210mm] bg-white p-8 text-slate-900 print:p-0">
      <div className="flex justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xs font-semibold tracking-[0.25em] text-sky-700">
            {company.shortName}
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{company.tradingName}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {company.legalName}
            <br />
            Company No. {company.companyNo}
            <br />
            {companyAddressLines().join(", ")}
            <br />
            {company.phoneDisplay} · {company.email}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold">INVOICE</div>
          <div className="mt-2 font-mono text-lg">{invoice.invoiceNumber}</div>
          <div className="text-sm text-slate-600">{formatDate(invoice.issuedAt)}</div>
          <div className="mt-2 text-sm font-medium">{labelStatus(invoice.status)}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Bill to</div>
          <div className="mt-1 font-medium">{invoice.customer.name}</div>
          {invoice.customer.businessName ? (
            <div>{invoice.customer.businessName}</div>
          ) : null}
          <div className="text-sm text-slate-600">
            Client ID: {invoice.customer.clientId}
            {invoice.customer.vatNumber ? <div>VAT: {invoice.customer.vatNumber}</div> : null}
            {invoice.customer.address ? <div>{invoice.customer.address}</div> : null}
            {invoice.customer.phone ? <div>{invoice.customer.phone}</div> : null}
            {invoice.customer.email ? <div>{invoice.customer.email}</div> : null}
          </div>
        </div>
        <div className="text-sm text-slate-600 sm:text-right">
          FX rate: 1 GBP = {invoice.fxRate} EUR
        </div>
      </div>

      <table className="mt-8 w-full text-left text-sm">
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
                {formatGbp(line.unitPriceGbp)}
                <div className="text-xs text-slate-500">{formatEur(line.unitPriceEur)}</div>
              </td>
              <td className="py-2 text-right tabular-nums">
                {formatGbp(line.qty * line.unitPriceGbp)}
                <div className="text-xs text-slate-500">
                  {formatEur(line.qty * line.unitPriceEur)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {invoice.stockUnits.length ? (
        <div className="mt-4 text-xs text-slate-500">
          IMEIs: {invoice.stockUnits.map((unit) => unit.imei).join(", ")}
        </div>
      ) : null}

      <div className="mt-6 ml-auto w-full max-w-sm text-sm">
        <div className="flex justify-between py-1">
          <span>Subtotal</span>
          <span>
            {formatGbp(totals.subGbp)} / {formatEur(totals.subEur)}
          </span>
        </div>
        <div className="flex justify-between py-1">
          <span>Shipping</span>
          <span>
            {formatGbp(totals.shippingGbp)} / {formatEur(totals.shippingEur)}
          </span>
        </div>
        <div className="flex justify-between border-t border-slate-300 py-2 text-base font-semibold">
          <span>Total</span>
          <span>
            {formatGbp(totals.totalGbp)} / {formatEur(totals.totalEur)}
          </span>
        </div>
      </div>

      {invoice.notes ? (
        <p className="mt-8 text-sm text-slate-600">Notes: {invoice.notes}</p>
      ) : null}
    </div>
  );
}

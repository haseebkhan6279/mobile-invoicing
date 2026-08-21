import { addressLines, companyForEntity } from "@/lib/company";
import { formatEur, formatGbp } from "@/lib/money";
import { groupRmaSummary, rmaTotals } from "@/lib/rma";
import { labelStatus } from "@/lib/status";
import { RMA_TERMS } from "@/lib/terms";
import { formatDate } from "@/lib/utils";

export type CreditNoteDoc = {
  rmaNumber: string;
  status: string;
  createdAt: Date | string;
  paymentType: string;
  paymentDate: Date | string | null;
  paymentAmountGbp: number;
  paymentAmountEur: number;
  notes: string | null;
  invoice: { invoiceNumber: string; entity: string };
  appliedInvoice: { invoiceNumber: string } | null;
  customer: {
    clientId: string;
    name: string;
    businessName: string | null;
    phone: string | null;
    email: string | null;
    vatNumber: string | null;
    address: string | null;
  };
  items: {
    id: string;
    unitPriceGbp: number;
    unitPriceEur: number;
    reason: string | null;
    stockUnit: {
      imei: string;
      productName: string;
      color: string;
      grade: string;
    };
  }[];
};

export function CreditNoteDocument({ rma }: { rma: CreditNoteDoc }) {
  const totals = rmaTotals(rma);
  const summary = groupRmaSummary(rma.items);
  const due = rma.paymentType === "PENDING" ? totals : { totalGbp: 0, totalEur: 0 };
  const entity = rma.invoice.entity;
  const company = companyForEntity(entity);
  const money = (gbp: number, eur: number) => (entity === "NI" ? formatEur(eur) : formatGbp(gbp));

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-8 text-slate-900 print:p-0">
      <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:justify-between">
        <div>
          <div className="text-xs font-semibold tracking-[0.25em] text-sky-700">
            {company.shortName}
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{company.tradingName}</h1>
          <p className="mt-2 text-sm text-slate-600">{addressLines(company).join(", ")}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold">CREDIT NOTE</div>
          <div className="mt-2 font-mono text-lg">Credit Note No. {rma.rmaNumber}</div>
          <div className="text-sm text-slate-600">RMA Date {formatDate(rma.createdAt)}</div>
          <div className="mt-2 text-sm font-medium">RMA Status: {labelStatus(rma.status)}</div>
          <div className="text-sm text-slate-600">Client ID: {rma.customer.clientId}</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs uppercase tracking-wide text-slate-500">Billing details</div>
        <div className="mt-1 font-medium">{rma.customer.name}</div>
        {rma.customer.businessName ? <div>{rma.customer.businessName}</div> : null}
        <div className="text-sm text-slate-600">
          {rma.customer.address ? <div>{rma.customer.address}</div> : null}
          {rma.customer.phone ? <div>{rma.customer.phone}</div> : null}
          {rma.customer.email ? <div>{rma.customer.email}</div> : null}
          {rma.customer.vatNumber ? <div>VAT Number: {rma.customer.vatNumber}</div> : null}
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-y border-slate-300 text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-2">Item</th>
            <th className="py-2 pr-2">Invoice No</th>
            <th className="py-2 pr-2">Product Name</th>
            <th className="py-2 pr-2">IMEI</th>
            <th className="py-2 pr-2">Colors</th>
            <th className="py-2 pr-2">Grade</th>
            <th className="py-2 text-right">Unit Price</th>
          </tr>
        </thead>
        <tbody>
          {rma.items.map((item, index) => (
            <tr key={item.id} className="border-b border-slate-100 align-top">
              <td className="py-2 pr-2">{index + 1}</td>
              <td className="py-2 pr-2">{rma.invoice.invoiceNumber}</td>
              <td className="py-2 pr-2">
                {item.stockUnit.productName}
                {item.reason ? (
                  <div className="text-xs text-slate-500">{item.reason}</div>
                ) : null}
              </td>
              <td className="py-2 pr-2 font-mono">{item.stockUnit.imei}</td>
              <td className="py-2 pr-2">{item.stockUnit.color}</td>
              <td className="py-2 pr-2">{item.stockUnit.grade}</td>
              <td className="py-2 text-right tabular-nums">
                {money(item.unitPriceGbp, item.unitPriceEur)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="mt-4 text-sm text-slate-600">Total: {rma.items.length}</div>

      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-sm border-t border-slate-300 py-2 text-right text-base font-semibold">
          Grand Total: {money(totals.totalGbp, totals.totalEur)}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-900">Stock Return Summary</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          {summary.map((group) => (
            <li key={`${group.productName}-${group.color}-${group.grade}`}>
              {group.productName} - {group.color} - {group.grade} - {group.qty} Units
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div>Payment Due: {money(due.totalGbp, due.totalEur)}</div>
        <div>Payment Type: {labelStatus(rma.paymentType)}</div>
        <div>Payment Date: {rma.paymentDate ? formatDate(rma.paymentDate) : "—"}</div>
        <div>Payment Amount: {money(rma.paymentAmountGbp, rma.paymentAmountEur)}</div>
        <div>Invoice Applied: {rma.appliedInvoice?.invoiceNumber ?? "—"}</div>
      </div>

      {rma.notes ? <p className="mt-6 text-sm text-slate-600">RMA Notes: {rma.notes}</p> : null}

      <div className="print-page-break mt-8 border-t border-slate-200 pt-8 text-xs text-slate-600">
        <ol className="list-decimal space-y-2 pl-5">
          {RMA_TERMS.map((term, index) => (
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

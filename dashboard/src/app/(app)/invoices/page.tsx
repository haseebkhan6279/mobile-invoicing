import { MobileListRow } from "@/components/mobile-list-row";
import { PageHeader } from "@/components/page-header";
import { MoneyPair } from "@/components/money-pair";
import { StatusBadge } from "@/components/status-badge";
import { Select } from "@/components/ui/select";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { ClickableRow } from "@/components/ui/clickable-row";
import { requireUser } from "@/lib/auth-guard";
import { invoiceTotals } from "@/lib/invoice";
import { apiClient } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: string;
  issuedAt: string;
  shippingCostGbp: number;
  shippingCostEur: number;
  paidAmountGbp: number;
  paidAmountEur: number;
  customer: { clientId: string; name: string };
  lines: { qty: number; unitPriceGbp: number; unitPriceEur: number }[];
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { apiToken } = await requireUser();
  const { status } = await searchParams;
  const query = status ? `?${new URLSearchParams({ status })}` : "";
  const invoices = await apiClient.get<InvoiceRow[]>(`/invoices${query}`, apiToken);

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Pending, awaiting payment, and paid. Amounts in GBP and EUR."
        action={{ href: "/invoices/new", label: "Create invoice" }}
      />
      <form className="mb-4">
        <Select name="status" defaultValue={status ?? ""} className="w-56">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="AWAITING_PAYMENT">Awaiting payment</option>
          <option value="PAID">Paid</option>
        </Select>
        <button className="ml-2 h-10 rounded-lg bg-white px-4 text-sm ring-1 ring-slate-200">
          Filter
        </button>
      </form>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
        <Table>
          <THead>
            <tr>
              <Th>Invoice</Th>
              <Th>Client ID</Th>
              <Th>Customer</Th>
              <Th>Status</Th>
              <Th>Total</Th>
              <Th>Date</Th>
            </tr>
          </THead>
          <tbody>
            {invoices.map((invoice) => {
              const totals = invoiceTotals(invoice);
              return (
                <ClickableRow key={invoice.id} href={`/invoices/${invoice.id}`}>
                  <Td className="font-medium text-[#0b3a6e]">{invoice.invoiceNumber}</Td>
                  <Td className="font-mono">{invoice.customer.clientId}</Td>
                  <Td>{invoice.customer.name}</Td>
                  <Td>
                    <StatusBadge status={invoice.status} />
                  </Td>
                  <Td>
                    <MoneyPair gbp={totals.totalGbp} eur={totals.totalEur} stacked />
                  </Td>
                  <Td>{formatDate(invoice.issuedAt)}</Td>
                </ClickableRow>
              );
            })}
          </tbody>
        </Table>
      </div>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white lg:hidden">
        {invoices.map((invoice) => {
          const totals = invoiceTotals(invoice);
          return (
            <MobileListRow
              key={invoice.id}
              href={`/invoices/${invoice.id}`}
              title={invoice.invoiceNumber}
              subtitle={invoice.customer.name}
              trailing={<StatusBadge status={invoice.status} />}
              meta={<MoneyPair gbp={totals.totalGbp} eur={totals.totalEur} stacked />}
            />
          );
        })}
        {!invoices.length ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No invoices yet.</p>
        ) : null}
      </div>
    </div>
  );
}

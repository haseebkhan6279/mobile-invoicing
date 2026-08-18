import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MoneyPair } from "@/components/money-pair";
import { StatusBadge } from "@/components/status-badge";
import { Select } from "@/components/ui/select";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guard";
import { invoiceTotals } from "@/lib/invoice";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireUser();
  const { status } = await searchParams;
  const invoices = await prisma.invoice.findMany({
    where: status ? { status } : undefined,
    include: { customer: true, lines: true },
    orderBy: { createdAt: "desc" },
  });

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
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
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
                <tr key={invoice.id}>
                  <Td>
                    <Link className="font-medium text-[#0b3a6e] hover:underline" href={`/invoices/${invoice.id}`}>
                      {invoice.invoiceNumber}
                    </Link>
                  </Td>
                  <Td className="font-mono">{invoice.customer.clientId}</Td>
                  <Td>{invoice.customer.name}</Td>
                  <Td>
                    <StatusBadge status={invoice.status} />
                  </Td>
                  <Td>
                    <MoneyPair gbp={totals.totalGbp} eur={totals.totalEur} stacked />
                  </Td>
                  <Td>{formatDate(invoice.issuedAt)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

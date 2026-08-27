import Link from "next/link";
import { MobileListRow } from "@/components/mobile-list-row";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guard";
import { apiClient } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

type RmaRow = {
  id: string;
  rmaNumber: string;
  status: string;
  createdAt: string;
  customer: { name: string };
  invoice: { invoiceNumber: string };
  items: unknown[];
};

export default async function ReturnsPage() {
  const { apiToken } = await requireUser();
  const rmas = await apiClient.get<RmaRow[]>("/rma", apiToken);

  return (
    <div>
      <PageHeader
        title="Returns / RMA"
        description="Create an RMA against an invoice and IMEI."
        action={{ href: "/returns/new", label: "Create RMA" }}
      />
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <THead>
            <tr>
              <Th>RMA</Th>
              <Th>Invoice</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Status</Th>
              <Th>Date</Th>
            </tr>
          </THead>
          <tbody>
            {rmas.map((rma) => (
              <tr key={rma.id}>
                <Td>
                  <Link className="font-medium text-[#0b3a6e] hover:underline dark:text-sky-400" href={`/returns/${rma.id}`}>
                    {rma.rmaNumber}
                  </Link>
                </Td>
                <Td>{rma.invoice.invoiceNumber}</Td>
                <Td>{rma.customer.name}</Td>
                <Td>{rma.items.length}</Td>
                <Td>
                  <StatusBadge status={rma.status} />
                </Td>
                <Td>{formatDate(rma.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white lg:hidden dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {rmas.map((rma) => (
          <MobileListRow
            key={rma.id}
            href={`/returns/${rma.id}`}
            title={rma.rmaNumber}
            subtitle={`${rma.customer.name} · Inv ${rma.invoice.invoiceNumber}`}
            trailing={<StatusBadge status={rma.status} />}
            meta={`${rma.items.length} item${rma.items.length === 1 ? "" : "s"}`}
          />
        ))}
        {!rmas.length ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No returns yet.</p>
        ) : null}
      </div>
    </div>
  );
}

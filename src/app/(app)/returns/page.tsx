import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function ReturnsPage() {
  await requireUser();
  const rmas = await prisma.rma.findMany({
    include: { customer: true, invoice: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Returns / RMA"
        description="Create an RMA against an invoice and IMEI."
        action={{ href: "/returns/new", label: "Create RMA" }}
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
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
                  <Link className="font-medium text-[#0b3a6e] hover:underline" href={`/returns/${rma.id}`}>
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
    </div>
  );
}

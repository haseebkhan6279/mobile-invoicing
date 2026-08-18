import { notFound } from "next/navigation";
import { processRma } from "@/actions/rma";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { RMA_STATUSES } from "@/lib/status";
import Link from "next/link";

export default async function RmaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { ok } = await searchParams;
  const rma = await prisma.rma.findUnique({
    where: { id },
    include: {
      customer: true,
      invoice: true,
      items: { include: { stockUnit: true } },
    },
  });
  if (!rma) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={rma.rmaNumber}
        description={`${rma.customer.name} · ${rma.invoice.invoiceNumber}`}
      />
      <Notice ok={ok} />
      <Card>
        <p className="text-sm text-slate-600">
          Reason: {rma.reason || "—"}
          {rma.notes ? <span> · {rma.notes}</span> : null}
        </p>
        <p className="mt-2">
          Invoice:{" "}
          <Link className="text-[#0b3a6e] hover:underline" href={`/invoices/${rma.invoiceId}`}>
            {rma.invoice.invoiceNumber}
          </Link>
        </p>
      </Card>
      <Card>
        <Table>
          <THead>
            <tr>
              <Th>IMEI</Th>
              <Th>Product</Th>
              <Th>Action</Th>
              <Th>Stock status</Th>
            </tr>
          </THead>
          <tbody>
            {rma.items.map((item) => (
              <tr key={item.id}>
                <Td className="font-mono">{item.stockUnit.imei}</Td>
                <Td>
                  {item.stockUnit.productName} · {item.stockUnit.grade}
                </Td>
                <Td>{item.action}</Td>
                <Td>
                  <StatusBadge status={item.stockUnit.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <Card>
        <form action={processRma} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={rma.id} />
          <div>
            <Select name="status" defaultValue={rma.status}>
              {RMA_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">Update RMA</Button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Set to Received, Refunded, or Closed to restock, credit, or write off units.
        </p>
      </Card>
    </div>
  );
}

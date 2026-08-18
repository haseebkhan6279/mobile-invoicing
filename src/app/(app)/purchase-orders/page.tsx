import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MoneyPair } from "@/components/money-pair";
import { StatusBadge } from "@/components/status-badge";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function PurchaseOrdersPage() {
  await requireUser();
  const orders = await prisma.purchaseOrder.findMany({
    include: { supplier: true, lines: true, stockUnits: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Purchase orders"
        description="Order stock from suppliers, then receive IMEIs by grade."
        action={{ href: "/purchase-orders/new", label: "Create PO" }}
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <THead>
            <tr>
              <Th>PO</Th>
              <Th>Supplier</Th>
              <Th>Status</Th>
              <Th>Shipping</Th>
              <Th>Actual cost</Th>
              <Th>Received</Th>
              <Th>Date</Th>
            </tr>
          </THead>
          <tbody>
            {orders.map((po) => {
              const ordered = po.lines.reduce((sum, line) => sum + line.qty, 0);
              return (
                <tr key={po.id}>
                  <Td>
                    <Link className="font-medium text-[#0b3a6e] hover:underline" href={`/purchase-orders/${po.id}`}>
                      {po.poNumber}
                    </Link>
                  </Td>
                  <Td>{po.supplier.name}</Td>
                  <Td>
                    <StatusBadge status={po.status} />
                  </Td>
                  <Td>
                    <MoneyPair gbp={po.shippingCostGbp} eur={po.shippingCostEur} stacked />
                  </Td>
                  <Td>
                    <MoneyPair gbp={po.actualCostGbp} eur={po.actualCostEur} stacked />
                  </Td>
                  <Td>
                    {po.stockUnits.length}/{ordered}
                  </Td>
                  <Td>{formatDate(po.createdAt)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

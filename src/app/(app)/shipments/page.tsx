import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MoneyPair } from "@/components/money-pair";
import { StatusBadge } from "@/components/status-badge";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function ShipmentsPage() {
  await requireUser();
  const shipments = await prisma.shipment.findMany({
    include: { invoice: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Shipments"
        description="Tracking, quoted shipping cost, and actual courier cost."
        action={{ href: "/shipments/new", label: "Add shipment" }}
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <THead>
            <tr>
              <Th>Shipment</Th>
              <Th>Invoice</Th>
              <Th>Tracking</Th>
              <Th>Carrier</Th>
              <Th>Shipping cost</Th>
              <Th>Actual cost</Th>
              <Th>Status</Th>
              <Th>Date</Th>
            </tr>
          </THead>
          <tbody>
            {shipments.map((shipment) => (
              <tr key={shipment.id}>
                <Td>
                  <Link className="font-medium text-[#0b3a6e] hover:underline" href={`/shipments/${shipment.id}`}>
                    {shipment.shipmentNumber}
                  </Link>
                </Td>
                <Td>{shipment.invoice.invoiceNumber}</Td>
                <Td className="font-mono text-xs">{shipment.trackingNumber || "—"}</Td>
                <Td>{shipment.carrier || "—"}</Td>
                <Td>
                  <MoneyPair gbp={shipment.shippingCostGbp} eur={shipment.shippingCostEur} stacked />
                </Td>
                <Td>
                  <MoneyPair gbp={shipment.actualCostGbp} eur={shipment.actualCostEur} stacked />
                </Td>
                <Td>
                  <StatusBadge status={shipment.status} />
                </Td>
                <Td>{formatDate(shipment.createdAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

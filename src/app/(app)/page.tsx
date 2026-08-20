import Link from "next/link";
import { Boxes, FileText, Truck, Warehouse } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MoneyPair } from "@/components/money-pair";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { ClickableRow } from "@/components/ui/clickable-row";
import { requireUser } from "@/lib/auth-guard";
import { totalsFromLedger } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = (user.name ?? user.email ?? "there").split(" ")[0];
  const [stockCounts, unpaid, recentPos, recentInvoices, suppliers, shipments] =
    await Promise.all([
      prisma.stockUnit.groupBy({
        by: ["grade", "status"],
        _count: { _all: true },
        where: { status: "IN_STOCK" },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ["PENDING", "AWAITING_PAYMENT"] } },
        include: { customer: true, lines: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.purchaseOrder.findMany({
        include: { supplier: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.invoice.findMany({
        include: { customer: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.supplier.findMany({ include: { ledger: true } }),
      prisma.shipment.count({
        where: { status: { in: ["PREPARING", "SHIPPED", "IN_TRANSIT"] } },
      }),
    ]);

  const inStock = stockCounts.reduce((sum, row) => sum + row._count._all, 0);
  const payable = suppliers.reduce((acc, supplier) => {
    const t = totalsFromLedger(supplier.ledger);
    return {
      gbp: acc.gbp + t.balanceGbp,
      eur: acc.eur + t.balanceEur,
    };
  }, { gbp: 0, eur: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s what&apos;s happening across stock, invoices, and suppliers today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Boxes} label="In stock" value={inStock} tone="sky" />
        <StatCard icon={FileText} label="Unpaid invoices" value={unpaid.length} tone="amber" />
        <StatCard
          icon={Warehouse}
          label="Supplier payable"
          value={<MoneyPair gbp={payable.gbp} eur={payable.eur} stacked />}
          tone="violet"
        />
        <StatCard icon={Truck} label="Open shipments" value={shipments} tone="emerald" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium text-slate-900">In stock by grade</h2>
          <div className="flex flex-wrap gap-2">
            {stockCounts.length ? (
              stockCounts.map((row) => (
                <div
                  key={row.grade}
                  className="flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-sm text-sky-800 ring-1 ring-sky-100"
                >
                  <span className="text-slate-500">Grade {row.grade}</span>
                  <span className="font-semibold">{row._count._all}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No stock yet.</p>
            )}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-medium text-slate-900">Awaiting payment</h2>
          {unpaid.length ? (
            <ul className="divide-y divide-slate-100">
              {unpaid.map((invoice) => (
                <li key={invoice.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <Link className="text-sm font-medium text-[#0b3a6e] hover:underline" href={`/invoices/${invoice.id}`}>
                    {invoice.invoiceNumber} · {invoice.customer.name}
                  </Link>
                  <StatusBadge status={invoice.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No unpaid invoices.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-0">
          <h2 className="px-5 pt-5 font-medium text-slate-900">Recent purchase orders</h2>
          <div className="mt-3">
            <Table>
              <THead>
                <tr>
                  <Th>PO</Th>
                  <Th>Supplier</Th>
                  <Th>Status</Th>
                </tr>
              </THead>
              <tbody>
                {recentPos.map((po) => (
                  <ClickableRow key={po.id} href={`/purchase-orders/${po.id}`}>
                    <Td className="font-medium text-[#0b3a6e]">{po.poNumber}</Td>
                    <Td>{po.supplier.name}</Td>
                    <Td>
                      <StatusBadge status={po.status} />
                    </Td>
                  </ClickableRow>
                ))}
                {!recentPos.length ? (
                  <tr>
                    <Td className="text-slate-500" colSpan={3}>
                      No purchase orders yet.
                    </Td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </div>
        </Card>
        <Card className="p-0">
          <h2 className="px-5 pt-5 font-medium text-slate-900">Recent invoices</h2>
          <div className="mt-3">
            <Table>
              <THead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>Customer</Th>
                  <Th>Date</Th>
                </tr>
              </THead>
              <tbody>
                {recentInvoices.map((invoice) => (
                  <ClickableRow key={invoice.id} href={`/invoices/${invoice.id}`}>
                    <Td className="font-medium text-[#0b3a6e]">{invoice.invoiceNumber}</Td>
                    <Td>{invoice.customer.name}</Td>
                    <Td>{formatDate(invoice.issuedAt)}</Td>
                  </ClickableRow>
                ))}
                {!recentInvoices.length ? (
                  <tr>
                    <Td className="text-slate-500" colSpan={3}>
                      No invoices yet.
                    </Td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}

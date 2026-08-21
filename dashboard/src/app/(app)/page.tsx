import Link from "next/link";
import { Boxes, FileText, Truck, Warehouse } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MobileListRow } from "@/components/mobile-list-row";
import { MoneyPair } from "@/components/money-pair";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { ClickableRow } from "@/components/ui/clickable-row";
import { requireUser } from "@/lib/auth-guard";
import { totalsFromLedger, type LedgerEntry } from "@/lib/ledger";
import { apiClient } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  issuedAt: string;
  customer: { name: string };
};
type PurchaseOrder = { id: string; poNumber: string; status: string; supplier: { name: string } };
type Supplier = { ledger: LedgerEntry[] };
type Shipment = { status: string };
type StockUnit = { grade: string; status: string };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = (user.name ?? user.email ?? "there").split(" ")[0];
  const [stock, invoices, purchaseOrders, suppliers, shipmentsList] = await Promise.all([
    apiClient.get<StockUnit[]>("/stock?status=IN_STOCK", user.apiToken),
    apiClient.get<Invoice[]>("/invoices", user.apiToken),
    apiClient.get<PurchaseOrder[]>("/purchase-orders", user.apiToken),
    apiClient.get<Supplier[]>("/suppliers", user.apiToken),
    apiClient.get<Shipment[]>("/shipments", user.apiToken),
  ]);

  const stockCounts = Object.values(
    stock.reduce<Record<string, { grade: string; _count: { _all: number } }>>((acc, unit) => {
      acc[unit.grade] = acc[unit.grade] ?? { grade: unit.grade, _count: { _all: 0 } };
      acc[unit.grade]._count._all += 1;
      return acc;
    }, {}),
  );
  const unpaid = invoices
    .filter((invoice) => ["PENDING", "AWAITING_PAYMENT"].includes(invoice.status))
    .slice(0, 8);
  const recentPos = purchaseOrders.slice(0, 6);
  const recentInvoices = invoices.slice(0, 6);
  const shipments = shipmentsList.filter((s) =>
    ["PREPARING", "SHIPPED", "IN_TRANSIT"].includes(s.status),
  ).length;

  const inStock = stock.length;
  const payable = suppliers.reduce(
    (acc, supplier) => {
      const t = totalsFromLedger(supplier.ledger);
      return {
        gbp: acc.gbp + t.balanceGbp,
        eur: acc.eur + t.balanceEur,
      };
    },
    { gbp: 0, eur: 0 },
  );

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
          <div className="mt-3 hidden lg:block">
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
          <div className="mt-3 divide-y divide-slate-100 lg:hidden">
            {recentPos.map((po) => (
              <MobileListRow
                key={po.id}
                href={`/purchase-orders/${po.id}`}
                title={po.poNumber}
                subtitle={po.supplier.name}
                trailing={<StatusBadge status={po.status} />}
              />
            ))}
            {!recentPos.length ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">No purchase orders yet.</p>
            ) : null}
          </div>
        </Card>
        <Card className="p-0">
          <h2 className="px-5 pt-5 font-medium text-slate-900">Recent invoices</h2>
          <div className="mt-3 hidden lg:block">
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
          <div className="mt-3 divide-y divide-slate-100 lg:hidden">
            {recentInvoices.map((invoice) => (
              <MobileListRow
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                title={invoice.invoiceNumber}
                subtitle={invoice.customer.name}
                trailing={formatDate(invoice.issuedAt)}
              />
            ))}
            {!recentInvoices.length ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">No invoices yet.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

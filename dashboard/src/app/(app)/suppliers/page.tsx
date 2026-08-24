import Link from "next/link";
import { MobileListRow } from "@/components/mobile-list-row";
import { PageHeader } from "@/components/page-header";
import { MoneyPair } from "@/components/money-pair";
import { Notice } from "@/components/notice";
import { EditLink } from "@/components/ui/edit-link";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guard";
import { totalsFromLedger, type LedgerEntry } from "@/lib/ledger";
import { apiClient } from "@/lib/api-client";
import type { SupplierLookup } from "@/lib/lookups";

type SupplierRow = SupplierLookup & { ledger: LedgerEntry[]; _count: { purchaseOrders: number } };

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { apiToken } = await requireUser();
  const { ok, error } = await searchParams;
  const suppliers = await apiClient.get<SupplierRow[]>("/suppliers", apiToken);

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Credit, debit, and running hisab for each supplier."
        action={{ href: "/suppliers/new", label: "Add supplier" }}
      />
      <Notice ok={ok} error={error} />
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
        <Table>
          <THead>
            <tr>
              <Th>Supplier</Th>
              <Th>Credit</Th>
              <Th>Debit</Th>
              <Th>Balance (payable)</Th>
              <Th>POs</Th>
              <Th>Actions</Th>
            </tr>
          </THead>
          <tbody>
            {suppliers.map((supplier) => {
              const t = totalsFromLedger(supplier.ledger);
              return (
                <tr key={supplier.id} className="relative hover:bg-slate-50">
                  <Td>
                    <Link
                      href={`/suppliers/${supplier.id}`}
                      className="absolute inset-0"
                      aria-label={`View ${supplier.name}`}
                    />
                    <span className="font-medium text-[#0b3a6e]">{supplier.name}</span>
                    <div className="text-xs text-slate-500">
                      {supplier.phone || supplier.email || "—"}
                    </div>
                  </Td>
                  <Td>
                    <MoneyPair gbp={t.creditGbp} eur={t.creditEur} stacked />
                  </Td>
                  <Td>
                    <MoneyPair gbp={t.debitGbp} eur={t.debitEur} stacked />
                  </Td>
                  <Td>
                    <MoneyPair gbp={t.balanceGbp} eur={t.balanceEur} stacked />
                  </Td>
                  <Td>{supplier._count.purchaseOrders}</Td>
                  <Td>
                    <EditLink
                      href={`/suppliers/${supplier.id}`}
                      label={`Edit ${supplier.name}`}
                      className="relative z-10"
                    />
                  </Td>
                </tr>
              );
            })}
            {!suppliers.length ? (
              <tr>
                <Td className="py-8 text-center text-slate-500" >
                  No suppliers yet.
                </Td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </div>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white lg:hidden">
        {suppliers.map((supplier) => {
          const t = totalsFromLedger(supplier.ledger);
          return (
            <MobileListRow
              key={supplier.id}
              href={`/suppliers/${supplier.id}`}
              title={supplier.name}
              subtitle={supplier.phone || supplier.email || "—"}
              trailing={<MoneyPair gbp={t.balanceGbp} eur={t.balanceEur} stacked />}
              meta={`${supplier._count.purchaseOrders} PO${supplier._count.purchaseOrders === 1 ? "" : "s"}`}
            />
          );
        })}
        {!suppliers.length ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No suppliers yet.</p>
        ) : null}
      </div>
    </div>
  );
}

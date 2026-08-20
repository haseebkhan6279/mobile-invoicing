import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MoneyPair } from "@/components/money-pair";
import { Notice } from "@/components/notice";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guard";
import { totalsFromLedger } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireUser();
  const { ok, error } = await searchParams;
  const suppliers = await prisma.supplier.findMany({
    include: { ledger: true, _count: { select: { purchaseOrders: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Credit, debit, and running hisab for each supplier."
        action={{ href: "/suppliers/new", label: "Add supplier" }}
      />
      <Notice ok={ok} error={error} />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <THead>
            <tr>
              <Th>Supplier</Th>
              <Th>Credit</Th>
              <Th>Debit</Th>
              <Th>Balance (payable)</Th>
              <Th>POs</Th>
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
    </div>
  );
}

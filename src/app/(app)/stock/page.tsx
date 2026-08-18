import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { MoneyPair } from "@/components/money-pair";
import { Notice } from "@/components/notice";
import { StatusBadge } from "@/components/status-badge";
import { Select } from "@/components/ui/select";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; status?: string; grade?: string; q?: string }>;
}) {
  await requireUser();
  const { ok, status, grade, q } = await searchParams;
  const units = await prisma.stockUnit.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(grade ? { grade } : {}),
      ...(q
        ? {
            OR: [
              { imei: { contains: q } },
              { productName: { contains: q } },
            ],
          }
        : {}),
    },
    include: { supplier: true, invoice: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Stock inventory"
        description="IMEI-level stock by grade, colour, and network."
        action={{ href: "/stock/add", label: "Add stock" }}
      />
      <Notice ok={ok} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="IMEI or product"
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
        />
        <Select name="status" defaultValue={status ?? ""} className="w-44">
          <option value="">All statuses</option>
          <option value="IN_STOCK">In stock</option>
          <option value="RESERVED">Reserved</option>
          <option value="SOLD">Sold</option>
          <option value="RMA">RMA</option>
          <option value="FAULTY">Faulty</option>
        </Select>
        <Select name="grade" defaultValue={grade ?? ""} className="w-32">
          <option value="">All grades</option>
          <option value="A+">A+</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </Select>
        <button className="h-10 rounded-lg bg-white px-4 text-sm ring-1 ring-slate-200">
          Filter
        </button>
      </form>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <THead>
            <tr>
              <Th>IMEI</Th>
              <Th>Product</Th>
              <Th>Color</Th>
              <Th>Network</Th>
              <Th>Grade</Th>
              <Th>Cost</Th>
              <Th>Status</Th>
              <Th>Supplier</Th>
            </tr>
          </THead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id}>
                <Td className="font-mono text-xs">{unit.imei}</Td>
                <Td>{unit.productName}</Td>
                <Td>{unit.color}</Td>
                <Td>{unit.network}</Td>
                <Td>{unit.grade}</Td>
                <Td>
                  <MoneyPair gbp={unit.costGbp} eur={unit.costEur} stacked />
                </Td>
                <Td>
                  <StatusBadge status={unit.status} />
                  {unit.invoice ? (
                    <div className="text-xs">
                      <Link className="text-[#0b3a6e]" href={`/invoices/${unit.invoice.id}`}>
                        {unit.invoice.invoiceNumber}
                      </Link>
                    </div>
                  ) : null}
                </Td>
                <Td>{unit.supplier?.name ?? "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { updateStockUnitImei } from "@/actions/stock";
import { MobileListRow } from "@/components/mobile-list-row";
import { PageHeader } from "@/components/page-header";
import { MoneyPair } from "@/components/money-pair";
import { Notice } from "@/components/notice";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guard";
import { apiClient } from "@/lib/api-client";

type StockUnitRow = {
  id: string;
  imei: string | null;
  productName: string;
  color: string;
  network: string;
  grade: string;
  costGbp: number;
  costEur: number;
  status: string;
  supplier: { name: string } | null;
  invoice: { id: string; invoiceNumber: string } | null;
};

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; status?: string; grade?: string; q?: string }>;
}) {
  const { apiToken } = await requireUser();
  const { ok, status, grade, q } = await searchParams;
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (grade) params.set("grade", grade);
  if (q) params.set("q", q);
  const qs = params.toString();
  const units = await apiClient.get<StockUnitRow[]>(`/stock${qs ? `?${qs}` : ""}`, apiToken);

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
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
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
        <button className="h-10 rounded-lg bg-white px-4 text-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700">
          Filter
        </button>
      </form>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
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
                <Td className="font-mono text-xs">
                  {unit.imei ?? (
                    <form action={updateStockUnitImei} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={unit.id} />
                      <Input
                        name="imei"
                        placeholder="Add IMEI"
                        className="h-7 w-32 px-2 text-xs"
                      />
                      <SubmitButton pendingText="…" size="sm" variant="ghost" className="h-7 px-2">
                        Save
                      </SubmitButton>
                    </form>
                  )}
                </Td>
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
                      <Link className="text-[#0b3a6e] dark:text-sky-400" href={`/invoices/${unit.invoice.id}`}>
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
      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white lg:hidden dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {units.map((unit) => (
          <MobileListRow
            key={unit.id}
            title={unit.productName}
            subtitle={unit.imei ?? "No IMEI yet"}
            trailing={<StatusBadge status={unit.status} />}
            meta={
              <>
                <div>
                  {unit.grade} · {unit.color}
                </div>
                {unit.invoice ? (
                  <Link className="text-[#0b3a6e] dark:text-sky-400" href={`/invoices/${unit.invoice.id}`}>
                    {unit.invoice.invoiceNumber}
                  </Link>
                ) : null}
              </>
            }
          />
        ))}
        {!units.length ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No stock yet.</p>
        ) : null}
      </div>
    </div>
  );
}

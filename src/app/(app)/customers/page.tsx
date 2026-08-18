import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage() {
  await requireUser();
  const customers = await prisma.customer.findMany({
    include: { _count: { select: { invoices: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Client ID is assigned automatically. Type a name on invoices to auto-fetch details."
        action={{ href: "/customers/new", label: "Add customer" }}
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <THead>
            <tr>
              <Th>Client ID</Th>
              <Th>Name</Th>
              <Th>Business</Th>
              <Th>Phone</Th>
              <Th>Email</Th>
              <Th>Invoices</Th>
            </tr>
          </THead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <Td className="font-mono">{customer.clientId}</Td>
                <Td>
                  <Link className="font-medium text-[#0b3a6e] hover:underline" href={`/customers/${customer.id}`}>
                    {customer.name}
                  </Link>
                </Td>
                <Td>{customer.businessName || "—"}</Td>
                <Td>{customer.phone || "—"}</Td>
                <Td>{customer.email || "—"}</Td>
                <Td>{customer._count.invoices}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

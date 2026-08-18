import { notFound } from "next/navigation";
import { InvoiceDocument } from "@/components/invoice-document";
import { PrintButton } from "@/components/print-button";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      lines: { orderBy: { sortOrder: "asc" } },
      stockUnits: true,
    },
  });
  if (!invoice) notFound();

  return (
    <div>
      <div className="no-print mb-4">
        <PrintButton />
      </div>
      <InvoiceDocument invoice={invoice} />
    </div>
  );
}

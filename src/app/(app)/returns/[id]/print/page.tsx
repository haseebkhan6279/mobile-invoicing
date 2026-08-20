import { notFound } from "next/navigation";
import { CreditNoteDocument } from "@/components/credit-note-document";
import { PrintButton } from "@/components/print-button";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export default async function RmaPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const rma = await prisma.rma.findUnique({
    where: { id },
    include: {
      customer: true,
      invoice: true,
      appliedInvoice: true,
      items: { include: { stockUnit: true } },
    },
  });
  if (!rma) notFound();

  return (
    <div>
      <div className="no-print mb-4">
        <PrintButton />
      </div>
      <CreditNoteDocument rma={rma} />
    </div>
  );
}

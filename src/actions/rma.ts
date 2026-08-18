"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { toOptionalString } from "@/lib/lookups";
import { nextNumberTx } from "@/lib/numbers";
import { prisma } from "@/lib/prisma";

export async function createRma(formData: FormData) {
  await requireUser();
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const reason = toOptionalString(formData.get("reason"));
  const unitIds = formData.getAll("stockUnitId").map(String).filter(Boolean);
  if (!invoiceId || !unitIds.length) {
    redirect("/returns/new?error=Select an invoice and at least one IMEI");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { stockUnits: true, customer: true },
  });
  if (!invoice) redirect("/returns/new?error=Invoice not found");

  const allowed = new Set(invoice.stockUnits.map((unit) => unit.id));
  if (unitIds.some((id) => !allowed.has(id))) {
    redirect("/returns/new?error=IMEI does not belong to this invoice");
  }

  const rma = await prisma.$transaction(async (tx) => {
    const rmaNumber = await nextNumberTx(tx, "RMA", "RMA");
    const created = await tx.rma.create({
      data: {
        rmaNumber,
        invoiceId,
        customerId: invoice.customerId,
        reason,
        notes: toOptionalString(formData.get("notes")),
        status: "OPEN",
        items: {
          create: unitIds.map((stockUnitId) => ({
            stockUnitId,
            action: String(formData.get(`action-${stockUnitId}`) || "RESTOCK"),
          })),
        },
      },
    });
    await tx.stockUnit.updateMany({
      where: { id: { in: unitIds } },
      data: { status: "RMA" },
    });
    return created;
  });

  revalidatePath("/returns");
  revalidatePath("/stock");
  redirect(`/returns/${rma.id}`);
}

export async function processRma(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "RECEIVED");
  const rma = await prisma.rma.findUnique({
    where: { id },
    include: { items: { include: { stockUnit: true } } },
  });
  if (!rma) redirect("/returns");

  await prisma.$transaction(async (tx) => {
    await tx.rma.update({ where: { id }, data: { status } });
    if (status === "RECEIVED" || status === "CLOSED" || status === "REFUNDED") {
      for (const item of rma.items) {
        const data: { status: string; invoiceId?: null; invoiceLineId?: null } = {
          status: "RMA",
        };
        if (item.action === "RESTOCK") {
          data.status = "IN_STOCK";
          data.invoiceId = null;
          data.invoiceLineId = null;
        } else {
          data.status = "FAULTY";
        }
        await tx.stockUnit.update({
          where: { id: item.stockUnitId },
          data,
        });
      }
    }
  });

  revalidatePath(`/returns/${id}`);
  revalidatePath("/stock");
  redirect(`/returns/${id}?ok=RMA updated`);
}

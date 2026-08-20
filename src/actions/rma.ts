"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { invoiceTotals } from "@/lib/invoice";
import { toNumber, toOptionalString } from "@/lib/lookups";
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
    include: {
      stockUnits: { include: { invoiceLine: true } },
      customer: true,
    },
  });
  if (!invoice) redirect("/returns/new?error=Invoice not found");

  const allowed = new Set(invoice.stockUnits.map((unit) => unit.id));
  if (unitIds.some((id) => !allowed.has(id))) {
    redirect("/returns/new?error=IMEI does not belong to this invoice");
  }

  const unitById = new Map(invoice.stockUnits.map((unit) => [unit.id, unit]));

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
          create: unitIds.map((stockUnitId) => {
            const unit = unitById.get(stockUnitId);
            return {
              stockUnitId,
              action: String(formData.get(`action-${stockUnitId}`) || "RESTOCK"),
              reason: toOptionalString(formData.get(`reason-${stockUnitId}`)),
              unitPriceGbp: unit?.invoiceLine?.unitPriceGbp ?? 0,
              unitPriceEur: unit?.invoiceLine?.unitPriceEur ?? 0,
            };
          }),
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
  redirect(`/returns/${rma.id}?ok=RMA created`);
}

export async function applyRmaCredit(formData: FormData) {
  await requireUser();
  const rmaId = String(formData.get("rmaId") ?? "");
  const paymentType = String(formData.get("paymentType") ?? "PENDING");
  const appliedInvoiceId = toOptionalString(formData.get("appliedInvoiceId"));
  const paymentAmountGbp = toNumber(formData.get("paymentAmountGbp"));
  const paymentAmountEur = toNumber(formData.get("paymentAmountEur"));
  const paymentDateRaw = toOptionalString(formData.get("paymentDate"));
  if (!rmaId) redirect("/returns");

  if (paymentType === "APPLIED_TO_INVOICE" && !appliedInvoiceId) {
    redirect(`/returns/${rmaId}?error=Select an invoice to apply the credit to`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.rma.update({
      where: { id: rmaId },
      data: {
        paymentType,
        paymentDate: paymentDateRaw ? new Date(paymentDateRaw) : new Date(),
        paymentAmountGbp,
        paymentAmountEur,
        appliedInvoiceId: paymentType === "APPLIED_TO_INVOICE" ? appliedInvoiceId : null,
      },
    });

    if (paymentType === "APPLIED_TO_INVOICE" && appliedInvoiceId) {
      const target = await tx.invoice.findUnique({
        where: { id: appliedInvoiceId },
        include: { lines: true },
      });
      if (!target) redirect(`/returns/${rmaId}?error=Invoice not found`);

      const newPaidGbp = target.paidAmountGbp + paymentAmountGbp;
      const newPaidEur = target.paidAmountEur + paymentAmountEur;
      const totals = invoiceTotals({ ...target, paidAmountGbp: newPaidGbp, paidAmountEur: newPaidEur });
      const nextStatus =
        totals.dueGbp <= 0 && totals.dueEur <= 0
          ? "PAID"
          : target.status === "PENDING"
            ? "AWAITING_PAYMENT"
            : target.status;

      await tx.invoice.update({
        where: { id: appliedInvoiceId },
        data: {
          paidAmountGbp: newPaidGbp,
          paidAmountEur: newPaidEur,
          status: nextStatus,
          paidAt: nextStatus === "PAID" ? new Date() : target.paidAt,
        },
      });
    }
  });

  revalidatePath(`/returns/${rmaId}`);
  if (appliedInvoiceId) revalidatePath(`/invoices/${appliedInvoiceId}`);
  revalidatePath("/invoices");
  redirect(`/returns/${rmaId}?ok=Credit updated`);
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

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { parseImeis } from "@/lib/imei";
import { toNumber, toOptionalString } from "@/lib/lookups";
import { DEFAULT_FX_RATE } from "@/lib/money";
import { nextNumberTx } from "@/lib/numbers";
import { prisma } from "@/lib/prisma";

function parseInvoiceLines(formData: FormData) {
  const products = formData.getAll("lineProduct");
  const colors = formData.getAll("lineColor");
  const networks = formData.getAll("lineNetwork");
  const grades = formData.getAll("lineGrade");
  const qtys = formData.getAll("lineQty");
  const gbp = formData.getAll("linePriceGbp");
  const eur = formData.getAll("linePriceEur");
  const imeis = formData.getAll("lineImeis");
  const lines = [];
  for (let i = 0; i < products.length; i += 1) {
    const productName = String(products[i] ?? "").trim();
    const qty = toNumber(qtys[i], 0);
    if (!productName || qty <= 0) continue;
    lines.push({
      productName,
      color: String(colors[i] ?? "").trim() || "Black",
      network: String(networks[i] ?? "").trim() || "Unlocked",
      grade: String(grades[i] ?? "").trim() || "A",
      qty,
      unitPriceGbp: toNumber(gbp[i]),
      unitPriceEur: toNumber(eur[i]),
      imeis: parseImeis(String(imeis[i] ?? "")),
      sortOrder: i,
    });
  }
  return lines;
}

function stockStatusForInvoice(status: string) {
  return status === "PAID" ? "SOLD" : "RESERVED";
}

export async function createInvoice(formData: FormData) {
  await requireUser();
  const customerId = String(formData.get("customerId") ?? "");
  const status = String(formData.get("status") ?? "PENDING");
  const lines = parseInvoiceLines(formData);
  if (!customerId) redirect("/invoices/new?error=Select a customer");
  if (!lines.length) redirect("/invoices/new?error=Add at least one line");

  for (const line of lines) {
    if (line.imeis.length !== line.qty) {
      redirect(
        `/invoices/new?error=${encodeURIComponent(`Line ${line.productName}: qty ${line.qty} needs ${line.qty} IMEI(s)`)}`,
      );
    }
  }

  const allImeis = lines.flatMap((line) => line.imeis);
  if (new Set(allImeis).size !== allImeis.length) {
    redirect("/invoices/new?error=Duplicate IMEIs on this invoice");
  }

  const units = await prisma.stockUnit.findMany({
    where: { imei: { in: allImeis } },
  });
  if (units.length !== allImeis.length) {
    const found = new Set(units.map((unit) => unit.imei));
    const missing = allImeis.filter((imei) => !found.has(imei));
    redirect(`/invoices/new?error=${encodeURIComponent(`IMEI not in stock: ${missing.join(", ")}`)}`);
  }
  const unavailable = units.filter((unit) => unit.status !== "IN_STOCK");
  if (unavailable.length) {
    redirect(
      `/invoices/new?error=${encodeURIComponent(`Not in stock: ${unavailable.map((u) => u.imei).join(", ")}`)}`,
    );
  }

  const invoice = await prisma.$transaction(async (tx) => {
    const invoiceNumber = await nextNumberTx(tx, "INV", "INV");
    const created = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        status,
        fxRate: toNumber(formData.get("fxRate"), DEFAULT_FX_RATE),
        shippingCostGbp: toNumber(formData.get("shippingCostGbp")),
        shippingCostEur: toNumber(formData.get("shippingCostEur")),
        shippingLabel: toOptionalString(formData.get("shippingLabel")),
        paymentTerms: toOptionalString(formData.get("paymentTerms")) ?? "Immediate",
        warrantyTerms: toOptionalString(formData.get("warrantyTerms")) ?? "3 months",
        notes: toOptionalString(formData.get("notes")),
        paidAt: status === "PAID" ? new Date() : null,
        lines: {
          create: lines.map((line) => ({
            qty: line.qty,
            productName: line.productName,
            color: line.color,
            network: line.network,
            grade: line.grade,
            unitPriceGbp: line.unitPriceGbp,
            unitPriceEur: line.unitPriceEur,
            sortOrder: line.sortOrder,
          })),
        },
      },
      include: { lines: true },
    });

    const unitByImei = new Map(units.map((unit) => [unit.imei, unit]));
    const nextStatus = stockStatusForInvoice(status);
    for (const line of created.lines) {
      const source = lines[line.sortOrder];
      for (const imei of source.imeis) {
        const unit = unitByImei.get(imei);
        if (!unit) continue;
        await tx.stockUnit.update({
          where: { id: unit.id },
          data: {
            status: nextStatus,
            invoiceId: created.id,
            invoiceLineId: line.id,
          },
        });
      }
    }
    return created;
  });

  revalidatePath("/invoices");
  revalidatePath("/stock");
  redirect(`/invoices/${invoice.id}?ok=Invoice created`);
}

export async function updateInvoiceStatus(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "PENDING");
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { stockUnits: true },
  });
  if (!invoice) redirect("/invoices");

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id },
      data: {
        status,
        paidAt: status === "PAID" ? new Date() : null,
      },
    });
    const unitStatus = stockStatusForInvoice(status);
    for (const unit of invoice.stockUnits) {
      if (unit.status === "RMA" || unit.status === "FAULTY") continue;
      await tx.stockUnit.update({
        where: { id: unit.id },
        data: { status: unitStatus },
      });
    }
  });

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/stock");
  redirect(`/invoices/${id}?ok=Status updated`);
}

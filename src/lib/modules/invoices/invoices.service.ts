import { prisma } from "@/lib/prisma";
import { nextNumberTx } from "@/lib/numbers";
import { DEFAULT_FX_RATE } from "@/lib/money";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import type { CreateInvoiceInput, InvoiceLineInput } from "./dto/invoice.dto";

export type { CreateInvoiceInput, InvoiceLineInput };

export function stockStatusForInvoice(status: string) {
  return status === "PAID" ? "SOLD" : "RESERVED";
}

function normalizeLines(lines: InvoiceLineInput[]) {
  const normalized: (InvoiceLineInput & { sortOrder: number })[] = [];
  lines.forEach((line, i) => {
    const productName = (line.productName ?? "").trim();
    const qty = Number(line.qty) || 0;
    if (!productName || qty <= 0) return;
    normalized.push({
      productName,
      color: (line.color ?? "").toString().trim() || "Black",
      network: (line.network ?? "").toString().trim() || "Unlocked",
      grade: (line.grade ?? "").toString().trim() || "A",
      qty,
      unitPriceGbp: Number(line.unitPriceGbp) || 0,
      unitPriceEur: Number(line.unitPriceEur) || 0,
      imeis: line.imeis ?? [],
      sortOrder: i,
    });
  });
  return normalized;
}

export async function listInvoices(status?: string) {
  return prisma.invoice.findMany({
    where: status ? { status } : undefined,
    include: { customer: true, lines: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      lines: { orderBy: { sortOrder: "asc" } },
      stockUnits: true,
      shipments: true,
    },
  });
  if (!invoice) throw new NotFoundError("Invoice not found");
  return invoice;
}

export async function createInvoice(input: CreateInvoiceInput) {
  const customerId = input.customerId;
  const status = input.status ?? "PENDING";
  const lines = normalizeLines(input.lines ?? []);

  if (!customerId) throw new ValidationError("Select a customer");
  if (!lines.length) throw new ValidationError("Add at least one line");

  for (const line of lines) {
    if (line.imeis.length !== line.qty) {
      throw new ValidationError(
        `Line ${line.productName}: qty ${line.qty} needs ${line.qty} IMEI(s)`,
      );
    }
  }

  const allImeis = lines.flatMap((line) => line.imeis);
  if (new Set(allImeis).size !== allImeis.length) {
    throw new ValidationError("Duplicate IMEIs on this invoice");
  }

  const units = await prisma.stockUnit.findMany({ where: { imei: { in: allImeis } } });
  if (units.length !== allImeis.length) {
    const found = new Set(units.map((unit) => unit.imei));
    const missing = allImeis.filter((imei) => !found.has(imei));
    throw new ValidationError(`IMEI not in stock: ${missing.join(", ")}`);
  }
  const unavailable = units.filter((unit) => unit.status !== "IN_STOCK");
  if (unavailable.length) {
    throw new ValidationError(`Not in stock: ${unavailable.map((u) => u.imei).join(", ")}`);
  }

  return prisma.$transaction(async (tx) => {
    const invoiceNumber = await nextNumberTx(tx, "INV", "INV");
    const created = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        status,
        fxRate: input.fxRate ?? DEFAULT_FX_RATE,
        shippingCostGbp: Number(input.shippingCostGbp) || 0,
        shippingCostEur: Number(input.shippingCostEur) || 0,
        shippingLabel: input.shippingLabel ?? null,
        paymentTerms: input.paymentTerms ?? "Immediate",
        warrantyTerms: input.warrantyTerms ?? "3 months",
        notes: input.notes ?? null,
        paidAt: status === "PAID" ? new Date() : null,
        lines: {
          create: lines.map((line) => ({
            qty: line.qty,
            productName: line.productName,
            color: line.color!,
            network: line.network!,
            grade: line.grade!,
            unitPriceGbp: line.unitPriceGbp!,
            unitPriceEur: line.unitPriceEur!,
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
          data: { status: nextStatus, invoiceId: created.id, invoiceLineId: line.id },
        });
      }
    }
    return created;
  });
}

export async function updateInvoiceStatus(id: string, status: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { stockUnits: true },
  });
  if (!invoice) throw new NotFoundError("Invoice not found");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id },
      data: { status, paidAt: status === "PAID" ? new Date() : null },
    });
    const unitStatus = stockStatusForInvoice(status);
    for (const unit of invoice.stockUnits) {
      if (unit.status === "RMA" || unit.status === "FAULTY") continue;
      await tx.stockUnit.update({ where: { id: unit.id }, data: { status: unitStatus } });
    }
    return updated;
  });
}

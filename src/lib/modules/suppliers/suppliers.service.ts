import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errors";
import type { LedgerEntryInput, SupplierInput } from "./dto/supplier.dto";

export type { LedgerEntryInput, SupplierInput };

export async function listSuppliers() {
  return prisma.supplier.findMany({
    include: { ledger: true, _count: { select: { purchaseOrders: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getSupplier(id: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      ledger: { orderBy: { date: "asc" } },
      purchaseOrders: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!supplier) throw new NotFoundError("Supplier not found");
  return supplier;
}

export async function createSupplier(input: SupplierInput) {
  const name = input.name.trim();
  if (!name) throw new ValidationError("Name is required");
  return prisma.supplier.create({
    data: {
      name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      vatNumber: input.vatNumber ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function updateSupplier(id: string, input: SupplierInput) {
  const name = input.name.trim();
  if (!id || !name) throw new ValidationError("Name is required");
  return prisma.supplier.update({
    where: { id },
    data: {
      name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      vatNumber: input.vatNumber ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function deleteSupplier(id: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { _count: { select: { purchaseOrders: true, stockUnits: true } } },
  });
  if (!supplier) throw new NotFoundError("Supplier not found");
  if (supplier._count.purchaseOrders > 0 || supplier._count.stockUnits > 0) {
    throw new ConflictError("Cannot delete a supplier with purchase orders or stock on record");
  }
  await prisma.supplier.delete({ where: { id } });
}

export async function addLedgerEntry(supplierId: string, input: LedgerEntryInput) {
  const amountGbp = Number(input.amountGbp) || 0;
  const amountEur = Number(input.amountEur) || 0;
  if (!supplierId || amountGbp < 0 || amountEur < 0) {
    throw new ValidationError("Enter valid amounts");
  }
  if (amountGbp === 0 && amountEur === 0) {
    throw new ValidationError("Amount cannot be zero");
  }
  return prisma.supplierLedger.create({
    data: {
      supplierId,
      type: input.type === "CREDIT" ? "CREDIT" : "DEBIT",
      amountGbp,
      amountEur,
      date: input.date ? new Date(input.date) : new Date(),
      reference: input.reference ?? null,
      notes: input.notes ?? null,
    },
  });
}

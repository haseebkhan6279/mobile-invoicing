import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LedgerEntryDto, SupplierDto } from "./dto/supplier.dto";

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  listSuppliers() {
    return this.prisma.supplier.findMany({
      include: { ledger: true, _count: { select: { purchaseOrders: true } } },
      orderBy: { name: "asc" },
    });
  }

  async getSupplier(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        ledger: { orderBy: { date: "asc" } },
        purchaseOrders: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!supplier) throw new NotFoundException("Supplier not found");
    return supplier;
  }

  createSupplier(input: SupplierDto) {
    const name = input.name.trim();
    if (!name) throw new BadRequestException("Name is required");
    return this.prisma.supplier.create({
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

  updateSupplier(id: string, input: SupplierDto) {
    const name = input.name.trim();
    if (!id || !name) throw new BadRequestException("Name is required");
    return this.prisma.supplier.update({
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

  async deleteSupplier(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { purchaseOrders: true, stockUnits: true } } },
    });
    if (!supplier) throw new NotFoundException("Supplier not found");
    if (supplier._count.purchaseOrders > 0 || supplier._count.stockUnits > 0) {
      throw new ConflictException("Cannot delete a supplier with purchase orders or stock on record");
    }
    await this.prisma.supplier.delete({ where: { id } });
    return { deleted: true };
  }

  addLedgerEntry(supplierId: string, input: LedgerEntryDto) {
    const amountGbp = Number(input.amountGbp) || 0;
    if (!supplierId || amountGbp < 0) {
      throw new BadRequestException("Enter valid amounts");
    }
    if (amountGbp === 0) {
      throw new BadRequestException("Amount cannot be zero");
    }
    return this.prisma.supplierLedger.create({
      data: {
        supplierId,
        type: input.type === "CREDIT" ? "CREDIT" : "DEBIT",
        amountGbp,
        date: input.date ? new Date(input.date) : new Date(),
        reference: input.reference ?? null,
        notes: input.notes ?? null,
      },
    });
  }
}

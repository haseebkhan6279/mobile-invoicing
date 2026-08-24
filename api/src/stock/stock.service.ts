import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { isValidImei, validateImeiList } from "../common/imei";
import { roundMoney } from "../common/money";
import { ReceiveStockDto } from "./dto/stock.dto";

type NormalizedBatch = {
  productName: string;
  brand: string | null;
  color: string;
  network: string;
  grade: string;
  costGbp: number;
  costEur: number;
  // One entry per unit to create; null means "no IMEI yet".
  imeis: (string | null)[];
};

function normalizeBatches(batches: ReceiveStockDto["batches"]): NormalizedBatch[] {
  const normalized: NormalizedBatch[] = [];
  for (const batch of batches) {
    const productName = (batch.productName ?? "").trim();
    const rawImeis = batch.imeis ?? [];
    const qty = Number(batch.qty) || 0;
    if (!productName && !rawImeis.length && qty <= 0) continue;
    if (!productName) throw new BadRequestException("Product name is required for each grade batch.");

    let knownImeis: string[] = [];
    if (rawImeis.length) {
      const parsed = validateImeiList(rawImeis);
      if ("error" in parsed) throw new BadRequestException(parsed.error ?? "Invalid IMEI list");
      knownImeis = parsed.imeis ?? [];
    }

    const totalQty = Math.max(knownImeis.length, qty);
    if (totalQty <= 0) {
      throw new BadRequestException("Enter at least one IMEI or a quantity for each grade batch.");
    }

    const imeis: (string | null)[] = [
      ...knownImeis,
      ...Array<null>(totalQty - knownImeis.length).fill(null),
    ];

    normalized.push({
      productName,
      brand: batch.brand ?? null,
      color: (batch.color ?? "").toString().trim() || "Black",
      network: (batch.network ?? "").toString().trim() || "Unlocked",
      grade: (batch.grade ?? "").toString().trim() || "A",
      costGbp: Number(batch.costGbp) || 0,
      costEur: Number(batch.costEur) || 0,
      imeis,
    });
  }
  return normalized;
}

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  listStock(filters: { status?: string; grade?: string; q?: string }) {
    const { status, grade, q } = filters;
    return this.prisma.stockUnit.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(grade ? { grade } : {}),
        ...(q ? { OR: [{ imei: { contains: q } }, { productName: { contains: q } }] } : {}),
      },
      include: { supplier: true, invoice: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async receiveStockBatches(input: ReceiveStockDto) {
    const supplierId = input.supplierId ?? null;
    const purchaseOrderId = input.purchaseOrderId ?? null;
    const postLedger = Boolean(input.postLedger);
    const batches = normalizeBatches(input.batches ?? []);

    if (!batches.length) throw new BadRequestException("Add at least one grade batch");

    const allImeis = batches.flatMap((batch) => batch.imeis).filter((imei): imei is string => imei !== null);
    if (new Set(allImeis).size !== allImeis.length) {
      throw new BadRequestException("Duplicate IMEIs across batches");
    }

    const existing = await this.prisma.stockUnit.findMany({
      where: { imei: { in: allImeis } },
      select: { imei: true },
    });
    if (existing.length) {
      throw new ConflictException(`IMEI already in stock: ${existing.map((u) => u.imei).join(", ")}`);
    }

    const goodsGbp = roundMoney(
      batches.reduce((sum, batch) => sum + batch.costGbp * batch.imeis.length, 0),
    );
    const goodsEur = roundMoney(
      batches.reduce((sum, batch) => sum + batch.costEur * batch.imeis.length, 0),
    );

    return this.prisma.$transaction(async (tx) => {
      for (const batch of batches) {
        await tx.stockUnit.createMany({
          data: batch.imeis.map((imei) => ({
            imei,
            productName: batch.productName,
            brand: batch.brand,
            color: batch.color,
            network: batch.network,
            grade: batch.grade,
            costGbp: batch.costGbp,
            costEur: batch.costEur,
            status: "IN_STOCK",
            supplierId,
            purchaseOrderId,
          })),
        });
      }

      if (purchaseOrderId) {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: purchaseOrderId },
          include: { lines: true },
        });
        if (po) {
          const units = await tx.stockUnit.findMany({ where: { purchaseOrderId } });
          const ordered = po.lines.reduce((sum, line) => sum + line.qty, 0);
          const received = units.length;
          const receivedGbp = roundMoney(units.reduce((sum, unit) => sum + unit.costGbp, 0));
          const receivedEur = roundMoney(units.reduce((sum, unit) => sum + unit.costEur, 0));
          await tx.purchaseOrder.update({
            where: { id: purchaseOrderId },
            data: {
              status:
                received >= ordered && ordered > 0
                  ? "RECEIVED"
                  : received > 0
                    ? "PARTIAL"
                    : po.status,
              receivedAt: new Date(),
              actualCostGbp: roundMoney(receivedGbp + po.shippingCostGbp),
              actualCostEur: roundMoney(receivedEur + po.shippingCostEur),
            },
          });
        }
      }

      if (postLedger && supplierId && (goodsGbp > 0 || goodsEur > 0)) {
        await tx.supplierLedger.create({
          data: {
            supplierId,
            type: "CREDIT",
            amountGbp: goodsGbp,
            amountEur: goodsEur,
            reference: purchaseOrderId
              ? (await tx.purchaseOrder.findUnique({ where: { id: purchaseOrderId } }))?.poNumber
              : "Stock intake",
            notes: `Goods received (${allImeis.length} units)`,
            purchaseOrderId,
          },
        });
      }

      const unitsAdded = batches.reduce((sum, batch) => sum + batch.imeis.length, 0);
      return { unitsAdded, purchaseOrderId };
    });
  }

  async getAvailableImeis(
    spec: { productName: string; color: string; network: string; grade: string },
    limit = 50,
  ) {
    const units = await this.prisma.stockUnit.findMany({
      where: { status: "IN_STOCK", imei: { not: null }, ...spec },
      select: { imei: true },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    return units.map((u) => u.imei as string);
  }

  async updateStockUnitImei(id: string, imei: string) {
    const trimmed = imei.trim();
    if (!isValidImei(trimmed)) {
      throw new BadRequestException("Invalid IMEI. Use 15 digits.");
    }
    const unit = await this.prisma.stockUnit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException("Stock unit not found");

    const existing = await this.prisma.stockUnit.findUnique({ where: { imei: trimmed } });
    if (existing && existing.id !== id) {
      throw new ConflictException(`IMEI already in stock: ${trimmed}`);
    }

    return this.prisma.stockUnit.update({ where: { id }, data: { imei: trimmed } });
  }

  async searchStockProducts(query: string) {
    const q = query.trim();
    if (!q) return [];
    const groups = await this.prisma.stockUnit.groupBy({
      by: ["productName", "color", "network", "grade"],
      where: { status: "IN_STOCK", productName: { contains: q, mode: "insensitive" } },
      _count: { _all: true },
      _avg: { costGbp: true, costEur: true },
      orderBy: { productName: "asc" },
      take: 10,
    });
    return groups.map((g) => ({
      productName: g.productName,
      color: g.color,
      network: g.network,
      grade: g.grade,
      count: g._count._all,
      costGbp: roundMoney(g._avg.costGbp ?? 0),
      costEur: roundMoney(g._avg.costEur ?? 0),
    }));
  }
}

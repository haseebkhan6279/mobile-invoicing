import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { recordPaymentTx } from "../common/payments";
import { nextDocumentNumberTx } from "../common/numbers";
import { stockStatusForInvoice } from "../common/invoice";
import { roundMoney } from "../common/money";
import { rmaTotals } from "../common/rma";
import { parseDocumentDate } from "../common/status";
import {
  AddRmaItemsDto,
  ApplyRmaCreditDto,
  CreateRmaDto,
  UpdateRmaDto,
  UpdateRmaItemDto,
} from "./dto/rma.dto";

const EPSILON_GBP = 0.005;

// Once an RMA reaches one of these, its tracked units have left RMA status:
// RESTOCK units are back on the shelf, everything else is held as FAULTY.
const PROCESSED_STATUSES = ["RECEIVED", "CLOSED", "REFUNDED"];

function processedStockData(action: string) {
  return action === "RESTOCK"
    ? { status: "IN_STOCK", invoiceId: null, invoiceLineId: null }
    : { status: "FAULTY" };
}

type InvoiceWithUnits = Prisma.InvoiceGetPayload<{
  include: { stockUnits: { include: { invoiceLine: true } } };
}>;
type ItemInput = { stockUnitId: string; action?: string; reason?: string | null };
type ManualItemInput = {
  invoiceNumber?: string | null;
  productName?: string;
  imei?: string | null;
  color?: string | null;
  grade?: string | null;
  action?: string;
  unitPriceGbp?: number;
  reason?: string | null;
};

@Injectable()
export class RmaService {
  constructor(private prisma: PrismaService) {}

  listRmas(customerId?: string) {
    return this.prisma.rma.findMany({
      where: customerId ? { customerId } : undefined,
      include: { customer: true, invoice: true, items: true, payments: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getRma(id: string) {
    const rma = await this.prisma.rma.findUnique({
      where: { id },
      include: {
        customer: true,
        invoice: true,
        appliedInvoice: true,
        items: { include: { stockUnit: true } },
        payments: { include: { invoice: { select: { id: true, invoiceNumber: true } } } },
      },
    });
    if (!rma) throw new NotFoundException("RMA not found");
    return rma;
  }

  /**
   * Turns the requested IMEIs and manual rows into RmaItem rows, refusing units
   * that are not on the invoice or have already been returned on an RMA.
   */
  private async buildItemsTx(
    tx: Prisma.TransactionClient,
    invoice: InvoiceWithUnits,
    items: ItemInput[],
    manualInput: ManualItemInput[],
  ) {
    const unitIds = items.map((item) => item.stockUnitId).filter(Boolean);
    const manualItems = manualInput.filter((item) => (item.productName ?? "").trim());

    const unitById = new Map(invoice.stockUnits.map((unit) => [unit.id, unit]));
    if (unitIds.some((id) => !unitById.has(id))) {
      throw new BadRequestException("IMEI does not belong to this invoice");
    }
    if (unitIds.length) {
      // Only returns against this invoice count — a unit restocked and sold
      // again can come back on the new sale.
      const existing = await tx.rmaItem.findFirst({
        where: { stockUnitId: { in: unitIds }, rma: { invoiceId: invoice.id } },
        include: { rma: { select: { rmaNumber: true } }, stockUnit: { select: { imei: true } } },
      });
      if (existing) {
        const imei = existing.stockUnit?.imei;
        throw new BadRequestException(
          `${imei ? `IMEI ${imei}` : "This unit"} is already returned on ${existing.rma.rmaNumber}`,
        );
      }
    }

    const itemByUnitId = new Map(items.map((item) => [item.stockUnitId, item]));
    const unitRows = unitIds.map((stockUnitId) => {
      const unit = unitById.get(stockUnitId);
      const item = itemByUnitId.get(stockUnitId);
      return {
        stockUnitId,
        invoiceNumber: invoice.invoiceNumber,
        action: item?.action || "RESTOCK",
        reason: item?.reason ?? null,
        unitPriceGbp: unit?.invoiceLine?.unitPriceGbp ?? 0,
      };
    });
    const manualRows = manualItems.map((item) => ({
      invoiceNumber: (item.invoiceNumber ?? "").trim() || invoice.invoiceNumber,
      productName: (item.productName ?? "").trim(),
      imei: (item.imei ?? "").trim() || null,
      color: (item.color ?? "").trim() || null,
      grade: (item.grade ?? "").trim() || null,
      action: item.action || "RESTOCK",
      reason: item.reason ?? null,
      unitPriceGbp: Number(item.unitPriceGbp) || 0,
    }));
    return { unitRows, rows: [...unitRows, ...manualRows] };
  }

  private loadInvoiceWithUnits(invoiceId: string) {
    return this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { stockUnits: { include: { invoiceLine: true } } },
    });
  }

  async createRma(input: CreateRmaDto) {
    const invoiceId = input.invoiceId;
    if (!invoiceId) throw new BadRequestException("Select an invoice");

    const invoice = await this.loadInvoiceWithUnits(invoiceId);
    if (!invoice) throw new BadRequestException("Invoice not found");

    return this.prisma.$transaction(async (tx) => {
      const built = await this.buildItemsTx(tx, invoice, input.items ?? [], input.manualItems ?? []);
      if (!built.rows.length) {
        throw new BadRequestException("Select an invoice and at least one IMEI or manual item");
      }
      // A credit note belongs to the same region, and series, as its invoice.
      const rmaNumber = await nextDocumentNumberTx(tx, "RMA", invoice.printCurrency);
      const created = await tx.rma.create({
        data: {
          rmaNumber,
          invoiceId,
          customerId: invoice.customerId,
          reason: input.reason ?? null,
          notes: input.notes ?? null,
          status: "OPEN",
          items: { create: built.rows },
        },
      });
      if (built.unitRows.length) {
        await tx.stockUnit.updateMany({
          where: { id: { in: built.unitRows.map((row) => row.stockUnitId) } },
          data: { status: "RMA" },
        });
      }
      return created;
    });
  }

  async updateRma(id: string, input: UpdateRmaDto) {
    const rma = await this.prisma.rma.findUnique({ where: { id } });
    if (!rma) throw new NotFoundException("RMA not found");
    return this.prisma.rma.update({
      where: { id },
      data: {
        reason: input.reason !== undefined ? input.reason || null : rma.reason,
        notes: input.notes !== undefined ? input.notes || null : rma.notes,
        createdAt: parseDocumentDate(input.createdAt, rma.createdAt),
      },
    });
  }

  async addRmaItems(id: string, input: AddRmaItemsDto) {
    const rma = await this.prisma.rma.findUnique({ where: { id } });
    if (!rma) throw new NotFoundException("RMA not found");
    const invoice = await this.loadInvoiceWithUnits(rma.invoiceId);
    if (!invoice) throw new BadRequestException("Invoice not found");

    return this.prisma.$transaction(async (tx) => {
      const built = await this.buildItemsTx(tx, invoice, input.items ?? [], input.manualItems ?? []);
      if (!built.rows.length) {
        throw new BadRequestException("Select at least one IMEI or manual item");
      }
      await tx.rmaItem.createMany({ data: built.rows.map((row) => ({ ...row, rmaId: id })) });

      // Units added to an RMA that has already been processed go straight to
      // where processing would have put them.
      const processed = PROCESSED_STATUSES.includes(rma.status);
      for (const row of built.unitRows) {
        await tx.stockUnit.update({
          where: { id: row.stockUnitId },
          data: processed ? processedStockData(row.action) : { status: "RMA" },
        });
      }
      await this.syncCreditTx(tx, id);
      return { added: built.rows.length };
    });
  }

  async updateRmaItem(id: string, itemId: string, input: UpdateRmaItemDto) {
    const rma = await this.prisma.rma.findUnique({ where: { id } });
    if (!rma) throw new NotFoundException("RMA not found");
    const item = await this.prisma.rmaItem.findUnique({
      where: { id: itemId },
      include: { stockUnit: true },
    });
    if (!item || item.rmaId !== id) throw new NotFoundException("RMA item not found");

    const data: Prisma.RmaItemUpdateInput = {};
    if (input.reason !== undefined) data.reason = input.reason || null;
    if (input.action !== undefined) data.action = input.action;
    if (input.unitPriceGbp !== undefined) {
      if (input.unitPriceGbp < 0) throw new BadRequestException("Unit price cannot be negative");
      data.unitPriceGbp = roundMoney(input.unitPriceGbp);
    }
    // Product details belong to the stock record for a tracked unit, so only
    // manual items take them from here.
    if (!item.stockUnitId) {
      if (input.invoiceNumber !== undefined) {
        data.invoiceNumber = (input.invoiceNumber ?? "").trim() || item.invoiceNumber;
      }
      if (input.productName !== undefined) {
        const productName = input.productName.trim();
        if (!productName) throw new BadRequestException("Product name is required");
        data.productName = productName;
      }
      if (input.imei !== undefined) data.imei = (input.imei ?? "").trim() || null;
      if (input.color !== undefined) data.color = (input.color ?? "").trim() || null;
      if (input.grade !== undefined) data.grade = (input.grade ?? "").trim() || null;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.rmaItem.update({ where: { id: itemId }, data });

      // After processing, a tracked unit's stock status follows its action, so
      // switching between RESTOCK and a write-off moves the unit too.
      const nextAction = input.action ?? item.action;
      const wasRestock = item.action === "RESTOCK";
      const isRestock = nextAction === "RESTOCK";
      if (item.stockUnit && wasRestock !== isRestock && PROCESSED_STATUSES.includes(rma.status)) {
        if (wasRestock && item.stockUnit.invoiceId) {
          throw new ConflictException(
            `IMEI ${item.stockUnit.imei ?? ""} has been restocked and sold again — it can no longer be written off here`,
          );
        }
        await tx.stockUnit.update({
          where: { id: item.stockUnit.id },
          data: processedStockData(nextAction),
        });
      }
      await this.syncCreditTx(tx, id);
      return updated;
    });
  }

  async removeRmaItem(id: string, itemId: string) {
    const rma = await this.prisma.rma.findUnique({
      where: { id },
      include: { items: true, invoice: { select: { status: true, lines: true } } },
    });
    if (!rma) throw new NotFoundException("RMA not found");
    const item = rma.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new NotFoundException("RMA item not found");
    if (rma.items.length === 1) {
      throw new BadRequestException("An RMA needs at least one item — delete the RMA instead");
    }

    return this.prisma.$transaction(async (tx) => {
      if (item.stockUnitId) await this.releaseUnitTx(tx, rma, item.stockUnitId);
      await tx.rmaItem.delete({ where: { id: itemId } });
      await this.syncCreditTx(tx, id);
      return { deleted: true };
    });
  }

  /**
   * Puts a returned unit back on the invoice it was sold on, as if the return
   * had never been raised.
   */
  private async releaseUnitTx(
    tx: Prisma.TransactionClient,
    rma: { invoiceId: string; invoice: { status: string; lines: { id: string; imeis: string[] }[] } },
    stockUnitId: string,
  ) {
    const unit = await tx.stockUnit.findUnique({ where: { id: stockUnitId } });
    if (!unit) return;
    // A restocked unit that has since gone out on another invoice can't be
    // pulled back without breaking that sale.
    if (unit.invoiceId && unit.invoiceId !== rma.invoiceId) {
      throw new ConflictException(
        `IMEI ${unit.imei ?? ""} has been restocked and sold on another invoice — it can't go back on this one`,
      );
    }
    // A cancelled invoice already released its stock, so there is nothing
    // to put the unit back onto — it stays available.
    if (rma.invoice.status === "CANCELLED") {
      await tx.stockUnit.update({
        where: { id: stockUnitId },
        data: { status: "IN_STOCK", invoiceId: null, invoiceLineId: null },
      });
      return;
    }
    const line = rma.invoice.lines.find(
      (candidate) => unit.imei && candidate.imeis.includes(unit.imei),
    );
    await tx.stockUnit.update({
      where: { id: stockUnitId },
      data: {
        status: stockStatusForInvoice(rma.invoice.status),
        invoiceId: rma.invoiceId,
        invoiceLineId: line?.id ?? unit.invoiceLineId,
      },
    });
  }

  /**
   * Keeps the credit consistent after its items change: the note can't be worth
   * less than has already been spent from it, and whether it is still spendable
   * follows the new balance.
   */
  private async syncCreditTx(tx: Prisma.TransactionClient, id: string) {
    const rma = await tx.rma.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
    if (!rma) return;
    const totalGbp = rmaTotals(rma).totalGbp;
    const appliedGbp = roundMoney(rma.payments.reduce((sum, row) => sum + row.amountGbp, 0));
    if (appliedGbp > totalGbp + EPSILON_GBP) {
      throw new BadRequestException(
        `£${appliedGbp.toFixed(2)} of this credit is already applied to invoices — the items can't total less than that (now £${totalGbp.toFixed(2)})`,
      );
    }
    if (!rma.payments.length) return;
    const exhausted = roundMoney(totalGbp - appliedGbp) <= EPSILON_GBP;
    // REFUNDED is an administrative close-out and is left alone.
    if (rma.paymentType === "PENDING" && exhausted) {
      await tx.rma.update({
        where: { id },
        data: { paymentType: "APPLIED_TO_INVOICE", paymentDate: rma.paymentDate ?? new Date() },
      });
    } else if (rma.paymentType === "APPLIED_TO_INVOICE" && !exhausted) {
      await tx.rma.update({ where: { id }, data: { paymentType: "PENDING" } });
    }
  }

  async applyRmaCredit(rmaId: string, input: ApplyRmaCreditDto) {
    if (!rmaId) throw new NotFoundException("RMA not found");
    const paymentType = input.paymentType ?? "PENDING";
    const appliedInvoiceId = input.appliedInvoiceId || null;
    const paymentAmountGbp = Number(input.paymentAmountGbp) || 0;
    const paymentDateRaw = input.paymentDate || null;

    if (paymentType === "APPLIED_TO_INVOICE") {
      if (!appliedInvoiceId) {
        throw new BadRequestException("Select an invoice to apply the credit to");
      }
      if (paymentAmountGbp <= 0) {
        throw new BadRequestException("Enter an amount to apply");
      }
      return this.prisma.$transaction((tx) =>
        recordPaymentTx(tx, appliedInvoiceId, {
          amountGbp: paymentAmountGbp,
          rmaId,
          method: "RMA credit",
          paidAt: paymentDateRaw ? new Date(paymentDateRaw) : undefined,
        }),
      );
    }

    // PENDING (reset) or REFUNDED: administrative status change only, no invoice/payment side effects.
    return this.prisma.rma.update({
      where: { id: rmaId },
      data: {
        paymentType,
        paymentDate: paymentDateRaw ? new Date(paymentDateRaw) : new Date(),
        paymentAmountGbp,
        appliedInvoiceId: null,
      },
    });
  }

  async processRma(id: string, status: string) {
    const rma = await this.prisma.rma.findUnique({
      where: { id },
      include: { items: { include: { stockUnit: true } } },
    });
    if (!rma) throw new NotFoundException("RMA not found");

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.rma.update({ where: { id }, data: { status } });
      if (PROCESSED_STATUSES.includes(status)) {
        for (const item of rma.items) {
          if (!item.stockUnitId) continue;
          await tx.stockUnit.update({
            where: { id: item.stockUnitId },
            data: processedStockData(item.action),
          });
        }
      }
      return updated;
    });
  }

  async deleteRma(id: string) {
    const rma = await this.prisma.rma.findUnique({
      where: { id },
      include: { items: true, invoice: { select: { status: true, lines: true } } },
    });
    if (!rma) throw new NotFoundException("RMA not found");

    const payments = await this.prisma.payment.count({ where: { rmaId: id } });
    if (payments > 0) {
      throw new ConflictException(
        "This credit is applied to an invoice — remove those payments before deleting the RMA",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Creating and processing an RMA pulls units out of the sale (RMA,
      // FAULTY, or back to IN_STOCK). Deleting it puts each one back on the
      // invoice it was sold on, as if the return had never been raised.
      for (const item of rma.items) {
        if (item.stockUnitId) await this.releaseUnitTx(tx, rma, item.stockUnitId);
      }
      await tx.rmaItem.deleteMany({ where: { rmaId: id } });
      await tx.rma.delete({ where: { id } });
      return { deleted: true };
    });
  }
}

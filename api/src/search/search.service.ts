import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type InvoiceImeiHit = {
  invoiceId: string;
  invoiceNumber: string;
  invoiceStatus: string;
  productName: string;
  color: string;
  network: string;
  grade: string;
  imei: string;
};

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(query: string) {
    const q = query.trim();
    if (!q) {
      return {
        stock: [],
        invoices: [],
        customers: [],
        purchaseOrders: [],
        rmas: [],
        shipments: [],
        suppliers: [],
      };
    }

    // IMEIs are often pasted with spaces or dashes; keep the raw term for names
    // and numbers, and a stripped form for serial lookup.
    const imeiNeedle = q.replace(/[\s-]/g, "");
    const invoiceImeiHits = await this.findInvoiceImeiHits(imeiNeedle || q);

    const [stock, invoices, customers, purchaseOrders, rmas, shipments, suppliers] =
      await Promise.all([
        this.prisma.stockUnit.findMany({
          where: {
            OR: [
              { imei: { contains: q } },
              ...(imeiNeedle !== q ? [{ imei: { contains: imeiNeedle } }] : []),
              { productName: { contains: q } },
              { color: { contains: q } },
              { grade: { contains: q } },
            ],
          },
          include: { invoice: { select: { id: true, invoiceNumber: true } } },
          take: 15,
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.invoice.findMany({
          where: {
            OR: [
              { invoiceNumber: { contains: q } },
              { customer: { name: { contains: q } } },
              { customer: { clientId: { contains: q } } },
              { stockUnits: { some: { imei: { contains: imeiNeedle || q } } } },
              ...(invoiceImeiHits.length
                ? [{ id: { in: [...new Set(invoiceImeiHits.map((hit) => hit.invoiceId))] } }]
                : []),
            ],
          },
          include: { customer: true, lines: { select: { imeis: true } } },
          take: 10,
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.customer.findMany({
          where: {
            OR: [
              { name: { contains: q } },
              { clientId: { contains: q } },
              { businessName: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
            ],
          },
          take: 10,
        }),
        this.prisma.purchaseOrder.findMany({
          where: {
            OR: [{ poNumber: { contains: q } }, { supplier: { name: { contains: q } } }],
          },
          include: { supplier: true },
          take: 10,
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.rma.findMany({
          where: {
            OR: [
              { rmaNumber: { contains: q } },
              { customer: { name: { contains: q } } },
              { items: { some: { imei: { contains: imeiNeedle || q } } } },
            ],
          },
          include: { customer: true, invoice: true },
          take: 10,
        }),
        this.prisma.shipment.findMany({
          where: {
            OR: [
              { shipmentNumber: { contains: q } },
              { trackingNumber: { contains: q } },
              { carrier: { contains: q } },
            ],
          },
          include: { invoice: true },
          take: 10,
        }),
        this.prisma.supplier.findMany({
          where: { OR: [{ name: { contains: q } }, { phone: { contains: q } }] },
          take: 10,
        }),
      ]);

    const stockImeis = new Set(stock.map((unit) => unit.imei).filter(Boolean));
    const invoiceOnlyImeis = invoiceImeiHits
      .filter((hit) => !stockImeis.has(hit.imei))
      .slice(0, 15)
      .map((hit) => ({
        id: null as string | null,
        imei: hit.imei,
        productName: hit.productName,
        grade: hit.grade,
        color: hit.color,
        network: hit.network,
        status: hit.invoiceStatus,
        invoice: { id: hit.invoiceId, invoiceNumber: hit.invoiceNumber },
      }));

    return {
      stock: [...stock, ...invoiceOnlyImeis],
      invoices,
      customers,
      purchaseOrders,
      rmas,
      shipments,
      suppliers,
    };
  }

  // Invoice IMEIs live on InvoiceLine.imeis (a string array), which Prisma
  // can only exact-match with `has`. Unnest so a typed/pasted serial still hits.
  private async findInvoiceImeiHits(needle: string): Promise<InvoiceImeiHit[]> {
    if (!needle) return [];
    const pattern = `%${needle}%`;
    return this.prisma.$queryRaw<InvoiceImeiHit[]>`
      SELECT
        i.id AS "invoiceId",
        i."invoiceNumber" AS "invoiceNumber",
        i.status AS "invoiceStatus",
        l."productName" AS "productName",
        l.color AS color,
        l.network AS network,
        l.grade AS grade,
        imei
      FROM "InvoiceLine" l
      JOIN "Invoice" i ON i.id = l."invoiceId"
      CROSS JOIN unnest(l.imeis) AS imei
      WHERE imei ILIKE ${pattern}
      ORDER BY i."createdAt" DESC
      LIMIT 20
    `;
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

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

    const [stock, invoices, customers, purchaseOrders, rmas, shipments, suppliers] =
      await Promise.all([
        this.prisma.stockUnit.findMany({
          where: {
            OR: [
              { imei: { contains: q } },
              { productName: { contains: q } },
              { color: { contains: q } },
              { grade: { contains: q } },
            ],
          },
          take: 15,
          orderBy: { createdAt: "desc" },
        }),
        this.prisma.invoice.findMany({
          where: {
            OR: [
              { invoiceNumber: { contains: q } },
              { customer: { name: { contains: q } } },
              { customer: { clientId: { contains: q } } },
            ],
          },
          include: { customer: true },
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
            OR: [{ rmaNumber: { contains: q } }, { customer: { name: { contains: q } } }],
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

    return { stock, invoices, customers, purchaseOrders, rmas, shipments, suppliers };
  }
}

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { nextNumberTx } from "../common/numbers";
import { CustomerDto } from "./dto/customer.dto";

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async searchCustomers(query: string) {
    const q = query.trim();
    if (!q) return [];
    return this.prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { businessName: { contains: q } },
          { clientId: { contains: q } },
          { phone: { contains: q } },
          { email: { contains: q } },
        ],
      },
      orderBy: { name: "asc" },
      take: 8,
    });
  }

  listCustomers() {
    return this.prisma.customer.findMany({
      include: { _count: { select: { invoices: true } } },
      orderBy: { name: "asc" },
    });
  }

  async getCustomer(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { invoices: { orderBy: { createdAt: "desc" } } },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    return customer;
  }

  createCustomer(input: CustomerDto) {
    const name = input.name.trim();
    if (!name) throw new BadRequestException("Name is required");
    return this.prisma.$transaction(async (tx) => {
      const clientId = await nextNumberTx(tx, "CL", "CL");
      return tx.customer.create({
        data: {
          clientId,
          name,
          businessName: input.businessName ?? null,
          phone: input.phone ?? null,
          email: input.email ?? null,
          vatNumber: input.vatNumber ?? null,
          address: input.address ?? null,
          shippingAddress: input.shippingAddress ?? null,
          notes: input.notes ?? null,
        },
      });
    });
  }

  updateCustomer(id: string, input: CustomerDto) {
    const name = input.name.trim();
    if (!id || !name) throw new BadRequestException("Name is required");
    return this.prisma.customer.update({
      where: { id },
      data: {
        name,
        businessName: input.businessName ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        vatNumber: input.vatNumber ?? null,
        address: input.address ?? null,
        shippingAddress: input.shippingAddress ?? null,
        notes: input.notes ?? null,
      },
    });
  }
}

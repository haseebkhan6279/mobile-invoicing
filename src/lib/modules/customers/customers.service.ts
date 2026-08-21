import { prisma } from "@/lib/prisma";
import { nextNumberTx } from "@/lib/numbers";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import type { CustomerInput } from "./dto/customer.dto";

export type { CustomerInput };

export async function searchCustomers(query: string) {
  const q = query.trim();
  if (!q) return [];
  return prisma.customer.findMany({
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

export async function listCustomers() {
  return prisma.customer.findMany({
    include: { _count: { select: { invoices: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { invoices: { orderBy: { createdAt: "desc" } } },
  });
  if (!customer) throw new NotFoundError("Customer not found");
  return customer;
}

export async function createCustomer(input: CustomerInput) {
  const name = input.name.trim();
  if (!name) throw new ValidationError("Name is required");
  return prisma.$transaction(async (tx) => {
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

export async function updateCustomer(id: string, input: CustomerInput) {
  const name = input.name.trim();
  if (!id || !name) throw new ValidationError("Name is required");
  return prisma.customer.update({
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

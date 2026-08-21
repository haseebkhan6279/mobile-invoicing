import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LookupsService {
  constructor(private prisma: PrismaService) {}

  async getLookups() {
    const [grades, colors, networks, suppliers, customers] = await Promise.all([
      this.prisma.grade.findMany({ orderBy: { sortOrder: "asc" } }),
      this.prisma.color.findMany({ orderBy: { name: "asc" } }),
      this.prisma.network.findMany({ orderBy: { name: "asc" } }),
      this.prisma.supplier.findMany({ orderBy: { name: "asc" } }),
      this.prisma.customer.findMany({ orderBy: { name: "asc" }, take: 50 }),
    ]);
    return { grades, colors, networks, suppliers, customers };
  }
}

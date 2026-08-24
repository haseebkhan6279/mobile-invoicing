import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateColorDto, CreateGradeDto } from "./dto/lookups.dto";

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

  async createColor(input: CreateColorDto) {
    const name = input.name.trim();
    if (!name) throw new BadRequestException("Name is required");
    const existing = await this.prisma.color.findUnique({ where: { name } });
    if (existing) throw new ConflictException(`Color "${name}" already exists`);
    return this.prisma.color.create({ data: { name } });
  }

  async deleteColor(id: string) {
    const existing = await this.prisma.color.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Color not found");
    await this.prisma.color.delete({ where: { id } });
    return { ok: true };
  }

  async createGrade(input: CreateGradeDto) {
    const code = input.code.trim();
    const label = input.label.trim();
    if (!code || !label) throw new BadRequestException("Code and label are required");
    const existing = await this.prisma.grade.findUnique({ where: { code } });
    if (existing) throw new ConflictException(`Grade "${code}" already exists`);
    const sortOrder = input.sortOrder ?? (await this.nextGradeSortOrder());
    return this.prisma.grade.create({ data: { code, label, sortOrder } });
  }

  async deleteGrade(id: string) {
    const existing = await this.prisma.grade.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Grade not found");
    await this.prisma.grade.delete({ where: { id } });
    return { ok: true };
  }

  private async nextGradeSortOrder() {
    const last = await this.prisma.grade.findFirst({ orderBy: { sortOrder: "desc" } });
    return (last?.sortOrder ?? 0) + 1;
  }
}

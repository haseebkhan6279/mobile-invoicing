import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateActivityLogDto } from "./dto/activity-log.dto";

export type ActivityActor = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
};

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  record(
    dto: CreateActivityLogDto,
    actor?: ActivityActor | null,
    extras?: { ip?: string | null; userAgent?: string | null },
  ) {
    return this.prisma.activityLog
      .create({
        data: {
          type: dto.type,
          path: (dto.path || "/").slice(0, 500),
          title: (dto.title || "Activity").slice(0, 300),
          method: dto.method?.slice(0, 12) || null,
          status: dto.status ?? null,
          message: dto.message?.slice(0, 2000) || null,
          userId: actor?.id || null,
          userEmail: actor?.email?.slice(0, 200) || null,
          userName: actor?.name?.slice(0, 200) || null,
          ip: extras?.ip?.slice(0, 80) || null,
          userAgent: extras?.userAgent?.slice(0, 400) || null,
        },
      })
      .catch(() => null);
  }

  async list(filters: { type?: string; q?: string; userId?: string; take?: number }) {
    const take = Math.min(filters.take ?? 100, 200);
    const where: Prisma.ActivityLogWhereInput = {};
    if (filters.type) where.type = filters.type;
    if (filters.userId) where.userId = filters.userId;
    const q = filters.q?.trim();
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { message: { contains: q, mode: "insensitive" } },
        { path: { contains: q, mode: "insensitive" } },
        { userName: { contains: q, mode: "insensitive" } },
        { userEmail: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, errorCount, loginCount] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
      }),
      this.prisma.activityLog.count({ where: { type: "ERROR" } }),
      this.prisma.activityLog.count({ where: { type: "LOGIN", status: 200 } }),
    ]);

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [opensToday, errorsToday, uniqueUsers] = await Promise.all([
      this.prisma.activityLog.count({
        where: { type: "PAGE", createdAt: { gte: dayAgo } },
      }),
      this.prisma.activityLog.count({
        where: { type: "ERROR", createdAt: { gte: dayAgo } },
      }),
      this.prisma.activityLog.findMany({
        where: { createdAt: { gte: dayAgo }, userId: { not: null } },
        distinct: ["userId"],
        select: { userId: true },
      }),
    ]);

    return {
      items,
      summary: {
        errorCount,
        loginCount,
        opensToday,
        errorsToday,
        uniqueUsersToday: uniqueUsers.length,
      },
    };
  }
}

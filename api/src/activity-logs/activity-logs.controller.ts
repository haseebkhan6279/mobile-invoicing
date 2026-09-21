import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ActivityLogsService } from "./activity-logs.service";
import { CreateActivityLogDto, ListActivityLogsDto } from "./dto/activity-log.dto";

type ReqUser = { id?: string; email?: string; name?: string };

@Controller("activity-logs")
@UseGuards(JwtAuthGuard)
export class ActivityLogsController {
  constructor(private logs: ActivityLogsService) {}

  @Get()
  list(@Query() query: ListActivityLogsDto) {
    return this.logs.list(query);
  }

  @Post()
  ingest(@Body() dto: CreateActivityLogDto, @Req() req: Request & { user?: ReqUser }) {
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      typeof forwarded === "string" && forwarded.trim()
        ? forwarded.split(",")[0].trim()
        : req.ip ?? null;
    return this.logs.record(dto, req.user ?? null, {
      ip,
      userAgent: String(req.headers["user-agent"] ?? "") || null,
    });
  }
}

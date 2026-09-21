import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Request } from "express";
import { catchError, tap } from "rxjs/operators";
import { throwError } from "rxjs";
import { ActivityLogsService } from "./activity-logs.service";

type ReqUser = { id?: string; email?: string; name?: string };

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim();
  return req.ip ?? null;
}

function cleanPath(req: Request) {
  const raw = (req.originalUrl || req.url || "/").split("?")[0];
  return raw || "/";
}

function shouldSkip(method: string, path: string) {
  if (path.includes("/activity-logs")) return true;
  if (path.endsWith("/health") || path === "/health") return true;
  if (path.includes("/auth/refresh")) return true;
  if (path.includes("/auth/login")) return true;
  return false;
}

function actionTitle(method: string, path: string) {
  const p = path.replace(/^\/api\/v1/, "");
  const map: [RegExp, string][] = [
    [/^POST \/invoices$/, "Created invoice"],
    [/^PATCH \/invoices\/[^/]+$/, "Updated invoice"],
    [/^DELETE \/invoices\/[^/]+$/, "Deleted invoice"],
    [/^POST \/invoices\/[^/]+\/lines$/, "Added invoice line"],
    [/^DELETE \/invoices\/[^/]+\/lines\/[^/]+$/, "Removed invoice line"],
    [/^POST \/invoices\/[^/]+\/payments$/, "Recorded payment"],
    [/^POST \/invoices\/[^/]+\/send-email$/, "Emailed invoice"],
    [/^POST \/stock$/, "Added stock"],
    [/^PATCH \/stock\/[^/]+$/, "Updated stock"],
    [/^POST \/customers$/, "Created customer"],
    [/^PATCH \/customers\/[^/]+$/, "Updated customer"],
    [/^POST \/purchase-orders$/, "Created purchase order"],
    [/^POST \/purchase-orders\/[^/]+\/receive$/, "Received purchase order"],
    [/^POST \/rma$/, "Created RMA"],
    [/^POST \/shipments$/, "Created shipment"],
    [/^POST \/suppliers$/, "Created supplier"],
  ];
  const key = `${method} ${p}`;
  for (const [pattern, title] of map) {
    if (pattern.test(key)) return title;
  }
  return `${method} ${p}`;
}

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private logs: ActivityLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<Request & { user?: ReqUser }>();
    const method = (req.method || "GET").toUpperCase();
    const path = cleanPath(req);
    if (shouldSkip(method, path)) return next.handle();

    const actor = req.user ?? null;
    const extras = { ip: clientIp(req), userAgent: String(req.headers["user-agent"] ?? "") || null };

    return next.handle().pipe(
      tap(() => {
        if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;
        void this.logs.record(
          { type: "ACTION", method, path, title: actionTitle(method, path), status: 200 },
          actor,
          extras,
        );
      }),
      catchError((err: unknown) => {
        const status =
          err && typeof err === "object" && "getStatus" in err && typeof (err as { getStatus: () => number }).getStatus === "function"
            ? (err as { getStatus: () => number }).getStatus()
            : 500;
        const message = err instanceof Error ? err.message : "Request failed";
        void this.logs.record(
          {
            type: "ERROR",
            method,
            path,
            title: actionTitle(method, path),
            status,
            message,
          },
          actor,
          extras,
        );
        return throwError(() => err);
      }),
    );
  }
}

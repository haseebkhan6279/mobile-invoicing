import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser, type ApiUser } from "@/lib/api/guard";
import { ServiceError } from "@/lib/api/errors";
import { buildCorsHeaders, corsPreflightResponse } from "@/lib/api/cors";

type RouteContext<P extends Record<string, string> = Record<string, string>> = {
  params: Promise<P>;
};

type ApiHandler<P extends Record<string, string> = Record<string, string>> = (
  req: NextRequest,
  ctx: RouteContext<P>,
  user: ApiUser,
) => Promise<NextResponse>;

function withCors(req: NextRequest, res: NextResponse) {
  const cors = buildCorsHeaders(req);
  cors.forEach((value, key) => res.headers.set(key, value));
  return res;
}

function errorResponse(err: unknown) {
  if (err instanceof ServiceError) {
    return NextResponse.json({ error: { message: err.message } }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json(
    { error: { message: "Internal server error" } },
    { status: 500 },
  );
}

/**
 * Wraps a JSON API route handler with: CORS headers, requireApiUser auth (unless
 * `auth: false`), consistent { data } / { error: { message } } envelopes, and mapping
 * ServiceError -> its HTTP status (never leaking stack traces / Prisma internals).
 */
export function apiRoute<P extends Record<string, string> = Record<string, string>>(
  handler: ApiHandler<P>,
  options?: { auth?: boolean },
) {
  const requireAuth = options?.auth ?? true;
  return async (req: NextRequest, ctx: RouteContext<P>) => {
    try {
      const user = requireAuth ? await requireApiUser(req) : ({} as ApiUser);
      const res = await handler(req, ctx, user);
      return withCors(req, res);
    } catch (err) {
      return withCors(req, errorResponse(err));
    }
  };
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export const OPTIONS = (req: NextRequest) => corsPreflightResponse(req);

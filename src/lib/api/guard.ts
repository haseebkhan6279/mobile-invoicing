import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError } from "@/lib/api/errors";
import { verifyApiToken } from "@/lib/api/jwt";

export type ApiUser = { id: string; email: string; name: string };

/**
 * API equivalent of requireUser() (src/lib/auth-guard.ts) for the mobile JSON API.
 * Reads `Authorization: Bearer <token>`, verifies it, and returns the user.
 * Throws UnauthorizedError (mapped to HTTP 401) instead of redirecting.
 */
export async function requireApiUser(req: NextRequest): Promise<ApiUser> {
  const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedError("Missing or invalid Authorization header");
  }

  let payload;
  try {
    payload = await verifyApiToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }

  if (payload.type !== "access") {
    throw new UnauthorizedError("Invalid token type");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  return { id: user.id, email: user.email, name: user.name };
}

import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { issueTokenPair, verifyApiToken } from "@/lib/api/jwt";
import { UnauthorizedError, ValidationError } from "@/lib/api/errors";
import type { AuthResult, LoginInput, RefreshInput, RefreshResult } from "./dto/auth.dto";

export type { AuthResult, LoginInput, RefreshInput, RefreshResult };

// Same credential check as src/auth.ts's Credentials authorize() (the web session's login).
export async function login(input: LoginInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedError("Invalid email or password");
  const valid = await compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Invalid email or password");

  const tokens = await issueTokenPair({ id: user.id, email: user.email, name: user.name });
  return {
    user: { id: user.id, email: user.email, name: user.name },
    ...tokens,
    tokenType: "Bearer",
  };
}

export async function refresh(input: RefreshInput): Promise<RefreshResult> {
  const refreshToken = input.refreshToken;
  if (!refreshToken) throw new ValidationError("refreshToken is required");

  let payload;
  try {
    payload = await verifyApiToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }
  if (payload.type !== "refresh") throw new UnauthorizedError("Invalid token type");

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new UnauthorizedError("User not found");

  const tokens = await issueTokenPair({ id: user.id, email: user.email, name: user.name });
  return { ...tokens, tokenType: "Bearer" };
}

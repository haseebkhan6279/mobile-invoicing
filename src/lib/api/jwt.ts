import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const ALG = "HS256";
const ACCESS_TOKEN_TTL = "12h";
const REFRESH_TOKEN_TTL = "30d";

export type ApiTokenPayload = JWTPayload & {
  sub: string;
  email: string;
  name: string;
  type: "access" | "refresh";
};

function secretKey() {
  const secret = process.env.API_JWT_SECRET;
  if (!secret) {
    throw new Error("API_JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

async function signToken(
  payload: { sub: string; email: string; name: string; type: "access" | "refresh" },
  ttl: string,
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(secretKey());
}

export function signAccessToken(user: { id: string; email: string; name: string }) {
  return signToken({ sub: user.id, email: user.email, name: user.name, type: "access" }, ACCESS_TOKEN_TTL);
}

export function signRefreshToken(user: { id: string; email: string; name: string }) {
  return signToken({ sub: user.id, email: user.email, name: user.name, type: "refresh" }, REFRESH_TOKEN_TTL);
}

export async function issueTokenPair(user: { id: string; email: string; name: string }) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user),
    signRefreshToken(user),
  ]);
  return { accessToken, refreshToken, expiresIn: 12 * 60 * 60 };
}

export async function verifyApiToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey(), { algorithms: [ALG] });
  return payload as ApiTokenPayload;
}

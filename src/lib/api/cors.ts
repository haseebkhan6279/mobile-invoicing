import type { NextRequest } from "next/server";

const VERCEL_PREVIEW_ORIGIN = /^https:\/\/[\w.-]+\.vercel\.app$/;

// Sane local-dev default: Expo/Metro dev server origins (web preview + Expo Go LAN).
const DEFAULT_ORIGINS = "http://localhost:8081,http://localhost:19006";

function allowList() {
  const raw = process.env.MOBILE_APP_ORIGIN ?? DEFAULT_ORIGINS;
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin: string) {
  return allowList().includes(origin) || VERCEL_PREVIEW_ORIGIN.test(origin);
}

/**
 * Builds CORS response headers for a request.
 * - No Origin header (native app / server-to-server): no CORS headers needed, request is allowed through.
 * - Origin present and allow-listed (or a *.vercel.app preview): echoed back exactly (never "*", since
 *   Access-Control-Allow-Credentials is true).
 * - Origin present but not allowed: headers omitted, browser enforces the block client-side.
 */
export function buildCorsHeaders(req: NextRequest): Headers {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Vary", "Origin");

  const origin = req.headers.get("origin");
  if (origin && isOriginAllowed(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  return headers;
}

export function corsPreflightResponse(req: NextRequest): Response {
  return new Response(null, { status: 204, headers: buildCorsHeaders(req) });
}

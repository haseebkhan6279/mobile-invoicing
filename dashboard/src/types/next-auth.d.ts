import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    apiAccessToken: string;
  }

  interface User {
    apiAccessToken?: string;
    apiRefreshToken?: string;
    apiAccessTokenExpires?: number;
  }
}

// Note: the JWT type (from @auth/core/jwt, re-exported via next-auth/jwt with
// `export *`) doesn't merge reliably via `declare module "next-auth/jwt"` in this
// next-auth beta — src/auth.ts casts `token` locally instead of relying on this file.

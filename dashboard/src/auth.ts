import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { apiClient, ApiError } from "@/lib/api-client";

type LoginResult = {
  user: { id: string; email: string; name: string };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type RefreshResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type ApiTokenFields = {
  apiAccessToken?: string;
  apiRefreshToken?: string;
  apiAccessTokenExpires?: number;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        try {
          const result = await apiClient.post<LoginResult>("/auth/login", { email, password });
          return {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            apiAccessToken: result.accessToken,
            apiRefreshToken: result.refreshToken,
            apiAccessTokenExpires: Date.now() + result.expiresIn * 1000,
          };
        } catch (error) {
          if (error instanceof ApiError) return null;
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as typeof token & ApiTokenFields;

      if (user?.id) {
        t.sub = user.id;
        t.apiAccessToken = user.apiAccessToken;
        t.apiRefreshToken = user.apiRefreshToken;
        t.apiAccessTokenExpires = user.apiAccessTokenExpires;
        return t;
      }

      // Refresh the API access token a little before it actually expires.
      const expires = t.apiAccessTokenExpires ?? 0;
      if (Date.now() < expires - 60_000) {
        return t;
      }

      try {
        const refreshed = await apiClient.post<RefreshResult>("/auth/refresh", {
          refreshToken: t.apiRefreshToken,
        });
        t.apiAccessToken = refreshed.accessToken;
        t.apiRefreshToken = refreshed.refreshToken;
        t.apiAccessTokenExpires = Date.now() + refreshed.expiresIn * 1000;
      } catch {
        // Refresh failed (expired/invalid refresh token) — drop the access token so
        // requireUser()'s callers see an unusable session and redirect to /login.
        t.apiAccessToken = undefined;
      }

      return t;
    },
    session({ session, token }) {
      const t = token as typeof token & ApiTokenFields;
      if (session.user && t.sub) {
        session.user.id = t.sub;
      }
      session.apiAccessToken = t.apiAccessToken ?? "";
      return session;
    },
  },
});

import type { NextRequest } from "next/server";
import * as authService from "@/lib/modules/auth/auth.service";
import { apiRoute, ok } from "@/lib/api/handler";

export { OPTIONS } from "@/lib/api/handler";

export const POST = apiRoute(
  async (req: NextRequest) => {
    const body = await req.json().catch(() => ({}));
    const result = await authService.login({
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
    });
    return ok(result);
  },
  { auth: false },
);

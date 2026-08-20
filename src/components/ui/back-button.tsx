"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const MAIN_ROUTES = new Set([
  "/",
  "/suppliers",
  "/purchase-orders",
  "/stock",
  "/customers",
  "/invoices",
  "/returns",
  "/shipments",
  "/search",
]);

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (MAIN_ROUTES.has(pathname)) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Boxes,
  FileText,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Package,
  RotateCcw,
  Search,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { sellerCompany as company } from "@/lib/company";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/suppliers", label: "Suppliers", icon: Warehouse },
  { href: "/purchase-orders", label: "Purchase orders", icon: Package },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/returns", label: "Returns / RMA", icon: RotateCcw },
  { href: "/shipments", label: "Shipments", icon: Truck },
  { href: "/search", label: "Search", icon: Search },
];

const PRIMARY_HREFS = ["/", "/stock", "/invoices", "/customers"];
const primaryNav = PRIMARY_HREFS.map((href) => nav.find((item) => item.href === href)!);
const moreNav = nav.filter((item) => !PRIMARY_HREFS.includes(item.href));

export function AppShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => setMoreOpen(false), [pathname]);
  const moreActive = moreNav.some((item) => pathname.startsWith(item.href));
  const initials = userName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="no-print hidden w-64 shrink-0 flex-col bg-gradient-to-b from-[#07162f] to-[#0a1f3d] text-white lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white shadow-lg shadow-sky-500/20">
            {company.shortName[0]}
          </div>
          <div>
            <div className="text-xs font-semibold tracking-[0.2em] text-sky-300">
              {company.shortName.toUpperCase()}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-white">Wholesale Ops</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-white/10 font-medium text-white ring-1 ring-inset ring-white/10"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-sky-300" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 border-t border-white/10 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-sky-200">
            {initials || "U"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-white">{userName}</div>
            <div className="truncate text-[11px] text-slate-400">{company.tradingName}</div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white/80 px-3 py-3 backdrop-blur sm:gap-4 sm:px-4 lg:px-8">
          <div className="shrink-0 font-semibold text-[#07162f] lg:hidden">
            {company.shortName} Ops
          </div>
          <form action="/search" className="min-w-0 flex-1 sm:max-w-xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                placeholder="Search IMEI, invoice, PO, customer, tracking…"
                className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-[#0b3a6e] focus:bg-white focus:ring-2 focus:ring-[#0b3a6e]/10"
              />
            </div>
          </form>
          <div className="ml-auto flex shrink-0 items-center gap-2 text-sm sm:gap-3">
            <span className="hidden text-slate-600 sm:inline">{userName}</span>
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Sign out"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 pb-24 lg:p-8 lg:pb-8">{children}</main>
      </div>

      <nav className="no-print fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {primaryNav.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]",
                active ? "font-medium text-[#0b3a6e]" : "text-slate-500",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]",
            moreActive ? "font-medium text-[#0b3a6e]" : "text-slate-500",
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </button>
      </nav>

      {moreOpen ? (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-200" />
            {moreNav.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm",
                    active ? "bg-slate-100 font-medium text-[#0b3a6e]" : "text-slate-700",
                  )}
                >
                  <Icon className="h-5 w-5 text-slate-400" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

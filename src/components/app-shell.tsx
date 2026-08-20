"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  FileText,
  LayoutDashboard,
  LogOut,
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

export function AppShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
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
        <header className="no-print flex items-center gap-2 border-b border-slate-200 bg-white/80 px-3 py-3 backdrop-blur sm:gap-4 sm:px-4 lg:px-8">
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
        <nav className="no-print flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

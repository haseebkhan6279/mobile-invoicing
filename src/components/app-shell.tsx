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
import { company } from "@/lib/company";
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

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="no-print hidden w-64 shrink-0 flex-col bg-[#07162f] text-white lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="text-xs font-semibold tracking-[0.2em] text-sky-300">
            {company.shortName}
          </div>
          <div className="mt-1 text-lg font-semibold">Wholesale Ops</div>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-slate-400">
          {company.tradingName}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <div className="font-semibold text-[#07162f] lg:hidden">
            {company.shortName} Ops
          </div>
          <form action="/search" className="max-w-xl flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                placeholder="Search IMEI, invoice, PO, customer, tracking…"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-[#0b3a6e] focus:bg-white"
              />
            </div>
          </form>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">{userName}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate-500 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" />
                Sign out
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

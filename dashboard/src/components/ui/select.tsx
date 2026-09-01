import { type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#0b3a6e] focus:bg-white focus:shadow-md focus:ring-4 focus:ring-[#0b3a6e]/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:bg-slate-800 dark:focus:ring-sky-500/10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

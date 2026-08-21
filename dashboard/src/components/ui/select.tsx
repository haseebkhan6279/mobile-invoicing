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
        "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none ring-[#0b3a6e]/20 focus:border-[#0b3a6e] focus:ring-2",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none ring-[#0b3a6e]/20 placeholder:text-slate-400 focus:border-[#0b3a6e] focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}

import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-gradient-to-b from-[#164d8c] to-[#0b3a6e] text-white shadow-md shadow-blue-900/25 ring-1 ring-inset ring-white/10 hover:brightness-110 hover:shadow-lg hover:shadow-blue-900/30 active:brightness-95 disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none disabled:ring-0 dark:shadow-black/40",
  secondary:
    "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:shadow-md dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700",
  danger:
    "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-md shadow-red-900/25 ring-1 ring-inset ring-white/10 hover:brightness-110 hover:shadow-lg hover:shadow-red-900/30 active:brightness-95",
  ghost:
    "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

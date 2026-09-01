import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-14px_rgba(15,23,42,0.16)] dark:border-slate-800/80 dark:bg-slate-900 dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_10px_28px_-14px_rgba(0,0,0,0.5)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

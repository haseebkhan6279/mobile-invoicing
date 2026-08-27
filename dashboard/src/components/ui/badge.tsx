import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "green" | "amber" | "red" | "violet";
  className?: string;
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    blue: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400",
    green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
    red: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400",
    violet: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

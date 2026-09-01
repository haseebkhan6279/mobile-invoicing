import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileListRow({
  href,
  title,
  subtitle,
  trailing,
  meta,
  className,
}: {
  href?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{title}</div>
        {subtitle ? (
          <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>
        ) : null}
      </div>
      {trailing || meta ? (
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          {trailing}
          {meta ? <div className="text-xs text-slate-500 dark:text-slate-400">{meta}</div> : null}
        </div>
      ) : null}
      {href ? <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" /> : null}
    </>
  );

  if (!href) {
    return (
      <div className={cn("flex items-center gap-3 px-4 py-3", className)}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors active:bg-sky-50/60 dark:active:bg-slate-800",
        className,
      )}
    >
      {content}
    </Link>
  );
}

import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <BackButton />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex h-10 items-center rounded-xl bg-gradient-to-b from-[#164d8c] to-[#0b3a6e] px-4 text-sm font-semibold text-white shadow-md shadow-blue-900/25 ring-1 ring-inset ring-white/10 transition-all duration-150 hover:brightness-110 hover:shadow-lg hover:shadow-blue-900/30 active:scale-[0.98]"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

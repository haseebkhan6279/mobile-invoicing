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
          className="inline-flex h-10 items-center rounded-lg bg-[#0b3a6e] px-4 text-sm font-medium text-white hover:bg-[#082c54]"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

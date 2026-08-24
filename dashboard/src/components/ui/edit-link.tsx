"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export function EditLink({
  href,
  label = "Edit",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-[#0b3a6e]",
        className,
      )}
    >
      <Pencil className="h-3.5 w-3.5" />
    </Link>
  );
}

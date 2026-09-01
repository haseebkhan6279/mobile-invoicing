"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function ClickableRow({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(href)}
      className={cn("cursor-pointer transition-colors hover:bg-sky-50/60 dark:hover:bg-slate-800/50", className)}
    >
      {children}
    </tr>
  );
}

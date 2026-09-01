import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tones = {
  sky: {
    icon: "bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/30",
    bar: "from-sky-400 to-blue-600",
    glow: "from-sky-400 to-blue-600",
  },
  amber: {
    icon: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30",
    bar: "from-amber-400 to-orange-500",
    glow: "from-amber-400 to-orange-500",
  },
  violet: {
    icon: "bg-gradient-to-br from-violet-400 to-purple-600 text-white shadow-lg shadow-violet-500/30",
    bar: "from-violet-400 to-purple-600",
    glow: "from-violet-400 to-purple-600",
  },
  emerald: {
    icon: "bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/30",
    bar: "from-emerald-400 to-teal-600",
    glow: "from-emerald-400 to-teal-600",
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "sky",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_36px_-14px_rgba(15,23,42,0.22)]">
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", tones[tone].bar)} />
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-[0.12] blur-2xl",
          tones[tone].glow,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {value}
          </div>
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tones[tone].icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

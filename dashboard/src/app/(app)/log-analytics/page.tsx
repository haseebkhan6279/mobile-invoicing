import { AlertTriangle, LayoutDashboard, LogIn, Users } from "lucide-react";
import { getActivityLogs } from "@/actions/activity-logs";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, Th, Td } from "@/components/ui/table";
import { requireUser } from "@/lib/auth-guard";
import { formatDateTime } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  LOGIN: "Login",
  PAGE: "Opened",
  ACTION: "Action",
  ERROR: "Error",
};

export default async function LogAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  await requireUser();
  const { type, q = "" } = await searchParams;
  const { items, summary } = await getActivityLogs({
    type: type && type !== "ALL" ? type : undefined,
    q: q.trim() || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log analytics"
        description="Who opened the dashboard, what they did, and any errors. This page is not in the menu — open it from search."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={LayoutDashboard} label="Screens opened (24h)" value={summary.opensToday} tone="sky" />
        <StatCard icon={Users} label="People active (24h)" value={summary.uniqueUsersToday} tone="violet" />
        <StatCard icon={LogIn} label="Successful logins" value={summary.loginCount} tone="emerald" />
        <StatCard icon={AlertTriangle} label="Errors (24h)" value={summary.errorsToday} tone="amber" />
      </div>

      <form className="flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Search name, email, page, error…" className="max-w-sm" />
        <Select name="type" defaultValue={type ?? "ALL"} className="w-40">
          <option value="ALL">All types</option>
          <option value="LOGIN">Logins</option>
          <option value="PAGE">Opened screens</option>
          <option value="ACTION">Actions</option>
          <option value="ERROR">Errors</option>
        </Select>
        <button className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          Filter
        </button>
      </form>

      <Card className="p-0">
        <Table>
          <THead>
            <tr>
              <Th>When</Th>
              <Th>Who</Th>
              <Th>Type</Th>
              <Th>What</Th>
              <Th>Detail</Th>
            </tr>
          </THead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <Td className="whitespace-nowrap">{formatDateTime(row.createdAt)}</Td>
                <Td>
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    {row.userName || "Unknown"}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {row.userEmail || "—"}
                  </div>
                </Td>
                <Td>
                  <span
                    className={
                      row.type === "ERROR"
                        ? "font-medium text-red-600 dark:text-red-400"
                        : "text-slate-600 dark:text-slate-300"
                    }
                  >
                    {TYPE_LABEL[row.type] ?? row.type}
                  </span>
                </Td>
                <Td>
                  <div>{row.title}</div>
                  <div className="font-mono text-xs text-slate-400">{row.path}</div>
                </Td>
                <Td className="max-w-xs">
                  {row.message ? (
                    <span className={row.type === "ERROR" ? "text-red-600 dark:text-red-400" : ""}>
                      {row.message}
                    </span>
                  ) : row.status ? (
                    <span className="text-slate-400">{row.status}</span>
                  ) : (
                    "—"
                  )}
                </Td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <Td colSpan={5} className="py-8 text-center text-slate-500">
                  No activity recorded yet. After people sign in and use the dashboard, rows appear here.
                </Td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

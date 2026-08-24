import { createColor, createGrade, deleteColor, deleteGrade } from "@/actions/lookups";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/auth-guard";
import { getLookups, type Color, type Grade } from "@/lib/lookups";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { apiToken } = await requireUser();
  const { ok, error } = await searchParams;
  const { grades, colors } = await getLookups(apiToken);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Manage the grade and color options offered across purchase orders and invoices."
      />
      <Notice ok={ok} error={error} />

      <Card>
        <h2 className="mb-4 font-medium">Grades</h2>
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {grades.map((grade: Grade) => (
            <div key={grade.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div>
                <span className="font-mono text-sm font-medium">{grade.code}</span>
                <span className="ml-2 text-sm text-slate-600">{grade.label}</span>
              </div>
              <form action={deleteGrade}>
                <input type="hidden" name="id" value={grade.id} />
                <button
                  type="submit"
                  className="text-xs font-medium text-slate-400 hover:text-red-600"
                >
                  Remove
                </button>
              </form>
            </div>
          ))}
          {!grades.length ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No grades yet.</p>
          ) : null}
        </div>
        <form
          action={createGrade}
          className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr_110px_auto] sm:items-end"
        >
          <div>
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" placeholder="A+" required />
          </div>
          <div>
            <Label htmlFor="label">Label</Label>
            <Input id="label" name="label" placeholder="Excellent condition" required />
          </div>
          <div>
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input id="sortOrder" name="sortOrder" type="number" placeholder="Auto" />
          </div>
          <SubmitButton pendingText="Adding…">Add grade</SubmitButton>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 font-medium">Colors</h2>
        <div className="flex flex-wrap gap-2">
          {colors.map((color: Color) => (
            <form
              key={color.id}
              action={deleteColor}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 text-sm"
            >
              {color.name}
              <input type="hidden" name="id" value={color.id} />
              <button
                type="submit"
                aria-label={`Remove ${color.name}`}
                className="rounded-full px-1.5 text-slate-400 hover:text-red-600"
              >
                ×
              </button>
            </form>
          ))}
          {!colors.length ? <p className="text-sm text-slate-500">No colors yet.</p> : null}
        </div>
        <form action={createColor} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <Label htmlFor="name">Color name</Label>
            <Input id="name" name="name" placeholder="Midnight Blue" required />
          </div>
          <SubmitButton pendingText="Adding…">Add color</SubmitButton>
        </form>
      </Card>
    </div>
  );
}

import { Hash, Mail, MapPin, Phone, StickyNote, User } from "lucide-react";
import { createSupplier } from "@/actions/suppliers";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth-guard";

function FieldIcon({ icon: Icon }: { icon: typeof User }) {
  return (
    <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</h2>
  );
}

export default async function NewSupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add supplier" />
      <Notice error={error} />
      <Card>
        <form action={createSupplier} className="space-y-6">
          <div className="space-y-3">
            <SectionLabel>Contact</SectionLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <FieldIcon icon={User} />
                  <Input id="name" name="name" required className="pl-9" />
                </div>
              </div>
              <div>
                <Label htmlFor="vatNumber">VAT number</Label>
                <div className="relative">
                  <FieldIcon icon={Hash} />
                  <Input id="vatNumber" name="vatNumber" className="pl-9" />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <FieldIcon icon={Phone} />
                  <Input id="phone" name="phone" className="pl-9" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <FieldIcon icon={Mail} />
                  <Input id="email" name="email" type="email" className="pl-9" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-6">
            <Label htmlFor="address">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                Address
              </span>
            </Label>
            <Textarea id="address" name="address" />
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-6">
            <Label htmlFor="notes">
              <span className="inline-flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5 text-slate-400" />
                Notes
              </span>
            </Label>
            <Textarea id="notes" name="notes" />
          </div>

          <SubmitButton pendingText="Adding…">Save supplier</SubmitButton>
        </form>
      </Card>
    </div>
  );
}

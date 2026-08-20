"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Supplier } from "@prisma/client";
import { updateSupplier } from "@/actions/suppliers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-sm text-slate-900">
        {value ? value : <span className="text-slate-400">—</span>}
      </dd>
    </div>
  );
}

export function SupplierDetailsCard({ supplier }: { supplier: Supplier }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium">Supplier details</h2>
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={supplier.name} />
          <Field label="VAT number" value={supplier.vatNumber} />
          <Field label="Phone" value={supplier.phone} />
          <Field label="Email" value={supplier.email} />
          <div className="sm:col-span-2">
            <Field label="Address" value={supplier.address} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes" value={supplier.notes} />
          </div>
        </dl>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-4 font-medium">Edit supplier details</h2>
      <form action={updateSupplier} className="space-y-4">
        <input type="hidden" name="id" value={supplier.id} />
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={supplier.name} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={supplier.phone ?? ""} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" defaultValue={supplier.email ?? ""} />
          </div>
        </div>
        <div>
          <Label htmlFor="vatNumber">VAT</Label>
          <Input id="vatNumber" name="vatNumber" defaultValue={supplier.vatNumber ?? ""} />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" name="address" defaultValue={supplier.address ?? ""} />
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" defaultValue={supplier.notes ?? ""} />
        </div>
        <div className="flex gap-2">
          <SubmitButton pendingText="Saving…">Save details</SubmitButton>
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

import { createCustomer } from "@/actions/customers";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth-guard";

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add customer" description="Client ID is generated automatically." />
      <Notice error={error} />
      <Card>
        <form action={createCustomer} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" name="businessName" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
          </div>
          <div>
            <Label htmlFor="vatNumber">VAT number</Label>
            <Input id="vatNumber" name="vatNumber" />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" />
          </div>
          <Button type="submit">Save customer</Button>
        </form>
      </Card>
    </div>
  );
}

import { sendInvoiceEmail } from "@/actions/invoices";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function EmailInvoiceForm({
  invoiceId,
  customerEmail,
  returnTo,
}: {
  invoiceId: string;
  customerEmail: string | null;
  returnTo: string;
}) {
  return (
    <form action={sendInvoiceEmail} className="flex items-end gap-2">
      <input type="hidden" name="id" value={invoiceId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div>
        <Input
          name="email"
          type="email"
          required
          defaultValue={customerEmail ?? ""}
          placeholder="customer@example.com"
          className="h-10 w-56"
        />
      </div>
      <SubmitButton pendingText="Sending…" size="md" variant="secondary">
        Email invoice
      </SubmitButton>
    </form>
  );
}

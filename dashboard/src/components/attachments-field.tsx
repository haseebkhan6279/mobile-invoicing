import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ATTACHMENT_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";

/** File picker for create forms; the action uploads it once the record exists. */
export function AttachmentsField({ label = "Attach files" }: { label?: string }) {
  return (
    <div>
      <Label htmlFor="attachments">{label}</Label>
      <Input id="attachments" name="attachments" type="file" multiple accept={ATTACHMENT_ACCEPT} />
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Optional. PDF or image, up to 4MB each. More can be added later.
      </p>
    </div>
  );
}

export type ImeiEntry = { imei: string; notes: string };

export function asImeiNotes(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, note] of Object.entries(value as Record<string, unknown>)) {
    const imei = key.trim();
    const text = typeof note === "string" ? note.trim() : "";
    if (imei && text) out[imei] = text;
  }
  return out;
}

export function entriesFromLine(imeis: string[] | undefined, imeiNotes: unknown): ImeiEntry[] {
  const notes = asImeiNotes(imeiNotes);
  if (!imeis?.length) return [{ imei: "", notes: "" }];
  return imeis.map((imei) => ({ imei, notes: notes[imei] ?? "" }));
}

export function parseImeiEntriesJson(raw: string): ImeiEntry[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => ({
        imei: String((entry as ImeiEntry)?.imei ?? "").trim(),
        notes: String((entry as ImeiEntry)?.notes ?? "").trim(),
      }))
      .filter((entry) => entry.imei);
  } catch {
    return [];
  }
}

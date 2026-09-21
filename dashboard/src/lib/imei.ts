/** HID scanners often add spaces, dashes, or a prefix around the 15 digits. */
export function normalizeScannedImei(raw: string) {
  const trimmed = raw.trim();
  const fifteen = trimmed.match(/\d{15}/);
  if (fifteen) return fifteen[0];
  return trimmed.replace(/[\s-]/g, "");
}

export function parseImeis(raw: string) {
  const values = raw
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  return values;
}

export function isValidImei(imei: string) {
  return /^\d{15}$/.test(imei);
}

export function validateImeiList(imeis: string[]) {
  const invalid = imeis.filter((imei) => !isValidImei(imei));
  const unique = new Set(imeis);
  if (invalid.length) {
    return { error: `Invalid IMEI(s): ${invalid.join(", ")}. Use 15 digits.` };
  }
  if (unique.size !== imeis.length) {
    return { error: "Duplicate IMEIs in this list." };
  }
  return { imeis };
}

export function validateImeis(raw: string) {
  return validateImeiList(parseImeis(raw));
}

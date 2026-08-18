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

export function validateImeis(raw: string) {
  const imeis = parseImeis(raw);
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

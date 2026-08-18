export function Notice({
  error,
  ok,
}: {
  error?: string;
  ok?: string;
}) {
  if (!error && !ok) return null;
  return (
    <div
      className={`mb-4 rounded-lg px-4 py-3 text-sm ${
        error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
      }`}
    >
      {error ?? ok}
    </div>
  );
}

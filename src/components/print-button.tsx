"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="h-10 rounded-lg bg-[#0b3a6e] px-4 text-sm font-medium text-white"
    >
      Print invoice
    </button>
  );
}

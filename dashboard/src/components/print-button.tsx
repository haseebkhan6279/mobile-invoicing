"use client";

export function PrintButton({ children = "Print invoice" }: { children?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="h-11 rounded-lg bg-brand-500 px-4 text-theme-sm font-medium text-white shadow-theme-xs transition-colors hover:bg-brand-600"
    >
      {children}
    </button>
  );
}

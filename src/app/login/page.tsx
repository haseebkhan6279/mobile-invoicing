import { LoginForm } from "@/components/login-form";
import { sellerCompany as company } from "@/lib/company";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#07162f] to-[#0a1f3d] p-4">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-black/5">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-base font-bold text-white shadow-lg shadow-sky-500/20">
            {company.shortName[0]}
          </div>
          <div>
            <div className="text-xs font-semibold tracking-[0.25em] text-sky-700">
              {company.shortName.toUpperCase()}
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Wholesale Ops</h1>
          </div>
        </div>
        <p className="mb-6 text-sm text-slate-500">
          Sign in to manage stock, invoices, and suppliers.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}

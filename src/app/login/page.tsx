import { LoginForm } from "@/components/login-form";
import { company } from "@/lib/company";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07162f] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6">
          <div className="text-xs font-semibold tracking-[0.25em] text-sky-700">
            {company.shortName}
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Wholesale Ops
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to manage stock, invoices, and suppliers.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

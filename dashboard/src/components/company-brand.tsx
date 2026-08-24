import type { CompanyEntity } from "@/lib/company";

export function CompanyBrand({ company }: { company: CompanyEntity }) {
  if (company.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={company.logo} alt={company.tradingName} className="h-24 w-auto object-contain" />;
  }
  return (
    <>
      <div className="text-xs font-semibold tracking-[0.25em] text-sky-700">
        {company.shortName}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{company.tradingName}</h1>
    </>
  );
}

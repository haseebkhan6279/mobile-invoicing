// TBD placeholder — no real account has been provided yet for this
// (entity, currency) pair. Replace with real details when known.
const TBD_BANK = {
  bankName: "TBD — add real bank details",
  accountName: "TBD",
  sortCode: "TBD",
  accountNumber: "TBD",
  iban: "TBD",
  bic: "TBD",
} as const;

export const sellerCompany = {
  legalName: "Atlantic Devices Solutions LTD",
  tradingName: "Atlantic Devices Solutions LTD",
  shortName: "Atlantic",
  logo: "/logo.jpeg" as string | null,
  companyNo: "NI742244",
  vatNumber: "GB048681389",
  eoriNumber: "GB048681389000",
  address: {
    line1: "12-16 Bridge Street",
    line2: "",
    postcode: "BT1 1LU",
    city: "Belfast",
    country: "United Kingdom",
  },
  phoneDisplay: "+447561400005",
  whatsappDisplay: "+447561400005",
  email: "atlanticdevicessolutions@gmail.com",
  tagline: "Wholesale operations",
  bank: {
    GBP: {
      bankName: "Tide",
      accountName: "Echo logic tech ltd",
      sortCode: "08-71-99",
      accountNumber: "14800963",
      iban: "",
      bic: "",
    },
    // No real EUR-receiving account has been provided for this entity yet.
    EUR: TBD_BANK,
  },
} as const;

export const creditNoteCompany = {
  legalName: "Atlantic Devices Solutions LTD",
  tradingName: "Atlantic Devices Solutions LTD",
  shortName: "Atlantic Devices Solutions",
  logo: "/logo.jpeg" as string | null,
  companyNo: "NI742244",
  // VAT number was not provided for this trading name — keeping the previous
  // entity's number as a placeholder. Replace once known.
  vatNumber: "XI 375676253",
  eoriNumber: "GB048681389000",
  address: {
    line1: "12-16 Bridge Street",
    line2: "",
    postcode: "BT1 1LU",
    city: "Belfast",
    country: "United Kingdom",
  },
  phoneDisplay: "+447561400005",
  whatsappDisplay: "+447561400005",
  email: "atlanticdevicessolutions@gmail.com",
  tagline: "Returns & credit notes",
  // No real bank account details were provided for this trading name yet
  // in either currency. Replace with real details when known.
  bank: {
    GBP: TBD_BANK,
    EUR: TBD_BANK,
  },
} as const;

export type CompanyEntity = typeof sellerCompany | typeof creditNoteCompany;
export type BankCurrency = "GBP" | "EUR";

export function addressLines(entity: CompanyEntity) {
  const { line1, line2, postcode, city, country } = entity.address;
  return [line1, line2, `${postcode} ${city}`, country].filter(Boolean) as string[];
}

export function companyForEntity(entity: string): CompanyEntity {
  return entity === "NI" ? creditNoteCompany : sellerCompany;
}

export function bankForCurrency(company: CompanyEntity, currency: BankCurrency) {
  return company.bank[currency];
}

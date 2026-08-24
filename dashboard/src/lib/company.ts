export const sellerCompany = {
  legalName: "Animus Corporation Limited",
  tradingName: "Animus Corporation Limited",
  shortName: "Animus",
  logo: null as string | null,
  companyNo: "11115138",
  vatNumber: "GB299538630",
  address: {
    line1: "34 Harmondsworth Lane",
    line2: "Sipson",
    postcode: "UB7 0JQ",
    city: "West Drayton",
    country: "United Kingdom",
  },
  phoneDisplay: "+442084323064",
  whatsappDisplay: "+447561000051",
  email: "sales@mobilephonesfactory.co.uk",
  tagline: "Wholesale operations",
  bank: {
    bankName: "Counting Up",
    accountName: "Animus Corporation Limited",
    sortCode: "23-69-72",
    accountNumber: "33062914",
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
  // No real bank account details were provided for this trading name —
  // reusing the UK account as a placeholder. Replace when known.
  bank: sellerCompany.bank,
} as const;

export type CompanyEntity = typeof sellerCompany | typeof creditNoteCompany;

export function addressLines(entity: CompanyEntity) {
  const { line1, line2, postcode, city, country } = entity.address;
  return [line1, line2, `${postcode} ${city}`, country].filter(Boolean) as string[];
}

export function companyForEntity(entity: string): CompanyEntity {
  return entity === "NI" ? creditNoteCompany : sellerCompany;
}

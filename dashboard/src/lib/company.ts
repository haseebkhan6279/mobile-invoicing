export const sellerCompany = {
  legalName: "Animus Corporation Limited",
  tradingName: "Animus Corporation Limited",
  shortName: "Animus",
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
  legalName: "Animus Corporation NI Limited",
  tradingName: "Animus Corporation NI Limited",
  shortName: "Animus NI",
  companyNo: "NI675814",
  vatNumber: "XI 375676253",
  address: {
    line1: "Regus Forsyth House",
    line2: "Cromac Square",
    postcode: "BT2 8LA",
    city: "Belfast, Northern Ireland",
    country: "United Kingdom",
  },
  phoneDisplay: sellerCompany.phoneDisplay,
  whatsappDisplay: sellerCompany.whatsappDisplay,
  email: sellerCompany.email,
  tagline: "Returns & credit notes",
  // No real NI bank account details were provided — reusing the UK account as a
  // placeholder. Replace with the actual NI Corporation bank details when known.
  bank: sellerCompany.bank,
} as const;

type CompanyEntity = typeof sellerCompany | typeof creditNoteCompany;

export function addressLines(entity: CompanyEntity) {
  const { line1, line2, postcode, city, country } = entity.address;
  return [line1, line2, `${postcode} ${city}`, country].filter(Boolean) as string[];
}

export function companyForEntity(entity: string): CompanyEntity {
  return entity === "NI" ? creditNoteCompany : sellerCompany;
}

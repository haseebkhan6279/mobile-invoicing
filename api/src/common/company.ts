export const company = {
  legalName: "Atlantic Devices Solutions LTD",
  tradingName: "Atlantic Devices Solutions LTD",
  shortName: "Atlantic",
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
  bank: {
    bankName: "Tide",
    accountName: "Echo logic tech ltd",
    sortCode: "08-71-99",
    accountNumber: "14800963",
  },
} as const;

export function companyAddressLines() {
  const { line1, line2, postcode, city, country } = company.address;
  return [line1, line2, `${postcode} ${city}`, country].filter(Boolean) as string[];
}

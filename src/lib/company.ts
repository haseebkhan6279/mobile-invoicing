export const company = {
  legalName: "Atlantic Devices Solutions LTD",
  tradingName: "Atlantic Devices Solutions",
  shortName: "ADS",
  companyNo: "NI742244",
  address: {
    line1: "12-16 Bridge Street",
    postcode: "BT1 1LU",
    city: "Belfast",
    country: "United Kingdom",
  },
  phoneDisplay: "07736 948197",
  email: "atlanticdevicessolutions@gmail.com",
  tagline: "Wholesale operations",
} as const;

export function companyAddressLines() {
  const { line1, postcode, city, country } = company.address;
  return [line1, `${postcode} ${city}`, country];
}

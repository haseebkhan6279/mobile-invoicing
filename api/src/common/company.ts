import type { PrintCurrency } from "./money";

// Supreme Retail prints Atlantic's company/VAT/EORI numbers: no separate set has
// been issued for it, so both entities share this block.
const REGISTRATION = {
  companyNo: "NI742244",
  vatNumber: "GB048681389",
  eoriNumber: "GB048681389000",
} as const;

/** Issues GBP invoices (internal id "ECHO"); paid into its own Tide account. */
export const supremeRetail = {
  legalName: "Supreme Retail Solutions LTD",
  tradingName: "Supreme Retail Solutions LTD",
  shortName: "Supreme Retail",
  ...REGISTRATION,
  address: {
    line1: "9 Coverdale Way",
    line2: "",
    postcode: "SL2 2LZ",
    city: "Slough",
    country: "United Kingdom",
  },
  phoneDisplay: "07561400005",
  whatsappDisplay: "07561400005",
  email: "echologicltd@gmail.com",
  bank: {
    bankName: "Tide",
    accountName: "Supreme Retail Solutions LTD",
    sortCode: "04-06-05",
    accountNumber: "33219703",
    bankAddress: ["4th Floor, The Featherstone Building", "66 City Road", "London EC1Y 2AL"],
  },
} as const;

/** Issues EUR invoices; paid into its own Wise account. */
export const atlantic = {
  legalName: "Atlantic Devices Solutions LTD",
  tradingName: "Atlantic Devices Solutions LTD",
  shortName: "Atlantic",
  ...REGISTRATION,
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
    bankName: "Wise",
    accountName: "Atlantic Devices Solutions LTD",
    iban: "BE85 9059 6137 6606",
    swift: "TRWIBEB1XXX",
    bankAddress: ["Rue du Trone 100, 3rd Floor", "Brussels, 1050", "Belgium"],
  },
} as const;

/** Atlantic's GBP account, for Atlantic invoices paid in pounds. */
const atlanticTide = {
  bankName: "Tide",
  accountName: "Atlantic Devices Solutions LTD",
  sortCode: "04-06-05",
  accountNumber: "32778387",
} as const;

export type CompanyEntity = typeof supremeRetail | typeof atlantic;
export type IssuingEntityId = "ATLANTIC" | "ECHO";
/** GBP = Supreme Retail Tide, EUR = Atlantic Wise, TIDE = Atlantic Tide (GBP). */
export type BankAccountId = "GBP" | "EUR" | "TIDE";

export function resolveIssuingEntity(
  entity?: string | null,
  printCurrency?: string,
): IssuingEntityId {
  if (entity === "ATLANTIC" || entity === "ECHO") return entity;
  return printCurrency === "EUR" ? "ATLANTIC" : "ECHO";
}

export function resolveBankAccount(
  account?: string | null,
  printCurrency?: string,
): BankAccountId {
  if (account === "EUR" || account === "GBP" || account === "TIDE") return account;
  return printCurrency === "EUR" ? "EUR" : "GBP";
}

export function companyForEntity(entity: IssuingEntityId): CompanyEntity {
  return entity === "ATLANTIC" ? atlantic : supremeRetail;
}

/** Legacy: EUR documents defaulted to Atlantic, GBP to Supreme Retail (ECHO). */
export function companyForCurrency(currency: PrintCurrency = "GBP"): CompanyEntity {
  return companyForEntity(resolveIssuingEntity(null, currency));
}

export function bankDetailLinesForAccount(account: BankAccountId) {
  if (account === "TIDE") return bankLines(atlanticTide);
  return bankDetailLines(account === "EUR" ? atlantic : supremeRetail);
}

export function companyAddressLines(entity: CompanyEntity) {
  const { line1, line2, postcode, city, country } = entity.address;
  return [line1, line2, `${postcode} ${city}`, country].filter(Boolean) as string[];
}

/** Bank block for the entity issuing the document. */
export function bankDetailLines(entity: CompanyEntity) {
  return bankLines(entity.bank);
}

function bankLines(bank: CompanyEntity["bank"] | typeof atlanticTide) {
  if ("iban" in bank) {
    return [
      `Bank Name: ${bank.bankName}`,
      `Account Name: ${bank.accountName}`,
      `IBAN: ${bank.iban}`,
      `Swift/BIC: ${bank.swift}`,
      `Bank Address: ${bank.bankAddress.join(", ")}`,
    ];
  }
  return [
    `Bank Name: ${bank.bankName}`,
    `Account Name: ${bank.accountName}`,
    `Sort code: ${bank.sortCode}`,
    `Account: ${bank.accountNumber}`,
    ...("bankAddress" in bank ? [`Bank Address: ${bank.bankAddress.join(", ")}`] : []),
  ];
}

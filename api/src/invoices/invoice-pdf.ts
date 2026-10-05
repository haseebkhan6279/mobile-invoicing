import PDFDocument from "pdfkit";
import { bankDetailLinesForAccount, companyAddressLines, companyForEntity, resolveBankAccount, resolveIssuingEntity } from "../common/company";
import { DEFAULT_GBP_TO_EUR_RATE, formatMoney, type PrintCurrency } from "../common/money";
import { formatDate } from "../common/status";
import { invoiceDueDate, invoiceToneLabel, invoiceTotals, invoiceVisualTone, INVOICE_NUMBER_BG, INVOICE_NUMBER_FG, INVOICE_TONE_COLORS } from "../common/invoice";
import { INVOICE_INVALID_UNTIL_PAID_NOTICE, INVOICE_MARGIN_NOTICE, INVOICE_TERMS } from "../common/invoice-terms";

export type InvoiceForPdf = {
  id: string;
  invoiceNumber: string;
  status: string;
  issuedAt: Date | string;
  shippingCostGbp: number;
  shippingLabel: string | null;
  paymentTerms: string | null;
  warrantyTerms: string | null;
  marginVatScheme: boolean;
  paidAmountGbp: number;
  printCurrency?: string;
  fxRate?: number;
  issuingEntity?: string;
  bankAccount?: string;
  customer: {
    clientId: string;
    name: string;
    businessName: string | null;
    phone: string | null;
    email: string | null;
    vatNumber: string | null;
    address: string | null;
    shippingAddress: string | null;
  };
  lines: {
    qty: number;
    productName: string;
    color: string;
    network: string;
    grade: string;
    unitPriceGbp: number;
    imeis?: string[];
  }[];
  stockUnits: { imei: string | null }[];
  installments?: { dueDate: Date | string; status: string }[];
};

const MARGIN = 40;
const PAGE_WIDTH = 595.28; // A4 pt

export type InvoicePdfOptions = {
  /** Currency the PDF is rendered in. Amounts are stored in GBP. */
  currency?: PrintCurrency;
  /** GBP -> EUR rate, used only when currency is EUR. */
  rate?: number;
};

export function buildInvoicePdf(
  invoice: InvoiceForPdf,
  options: InvoicePdfOptions = {},
): Promise<Buffer> {
  const currency = options.currency ?? "GBP";
  const rate = options.rate && options.rate > 0 ? options.rate : DEFAULT_GBP_TO_EUR_RATE;
  const seller = companyForEntity(resolveIssuingEntity(invoice.issuingEntity, invoice.printCurrency ?? currency));
  const bankLines = bankDetailLinesForAccount(
    resolveBankAccount(invoice.bankAccount, invoice.printCurrency ?? currency),
  );
  const money = (gbp: number) => formatMoney(gbp, currency, rate);
  const doc = new PDFDocument({ size: "A4", margin: MARGIN });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const totals = invoiceTotals(invoice);
  const dueDate = invoiceDueDate(invoice);
  const tone = invoiceVisualTone(invoice.status, totals.dueGbp, dueDate);
  const statusColors = INVOICE_TONE_COLORS[tone];
  const statusLabel = invoiceToneLabel(tone, invoice.status);

  doc.font("Helvetica-Bold").fontSize(16).fillColor("#0f172a").text(seller.tradingName, MARGIN, MARGIN);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#475569")
    .text(
      `${companyAddressLines(seller).join(", ")}\nTelephone: ${seller.phoneDisplay} · Whatsapp: ${seller.whatsappDisplay}`,
      { width: contentWidth * 0.55 },
    );

  const metaX = MARGIN + contentWidth * 0.52;
  const metaWidth = contentWidth * 0.48;
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#0f172a")
    .text("INVOICE", metaX, MARGIN, { width: metaWidth, align: "right" });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#64748b")
    .text("INVOICE NUMBER · PAYMENT REFERENCE", metaX, MARGIN + 28, {
      width: metaWidth,
      align: "right",
    });
  doc.font("Helvetica-Bold").fontSize(18);
  const numberLabel = invoice.invoiceNumber;
  const numberWidth = Math.min(metaWidth, doc.widthOfString(numberLabel) + 14);
  const numberX = PAGE_WIDTH - MARGIN - numberWidth;
  const numberY = MARGIN + 38;
  doc.roundedRect(numberX, numberY, numberWidth, 24, 4).fill(INVOICE_NUMBER_BG);
  doc.fillColor(INVOICE_NUMBER_FG).text(numberLabel, numberX, numberY + 5, {
    width: numberWidth,
    align: "center",
  });

  const badgeLabel = statusLabel.toUpperCase();
  doc.font("Helvetica-Bold").fontSize(8);
  const badgeWidth = Math.max(72, doc.widthOfString(badgeLabel) + 16);
  const badgeX = PAGE_WIDTH - MARGIN - badgeWidth;
  const badgeY = MARGIN + 64;
  doc.roundedRect(badgeX, badgeY, badgeWidth, 16, 8).fill(statusColors.bg);
  doc.fillColor(statusColors.fg).text(badgeLabel, badgeX, badgeY + 4, {
    width: badgeWidth,
    align: "center",
  });

  doc.fillColor("#64748b").font("Helvetica").fontSize(8);
  const metaTop = badgeY + 24;
  const metaLine = (label: string, value: string, y: number) => {
    doc.fillColor("#64748b").font("Helvetica").fontSize(8).text(label, metaX, y, {
      width: metaWidth * 0.45,
      align: "left",
    });
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(9).text(value, metaX + metaWidth * 0.45, y, {
      width: metaWidth * 0.55,
      align: "right",
    });
  };
  metaLine("Invoice date", formatDate(invoice.issuedAt), metaTop);
  metaLine("Due date", formatDate(dueDate), metaTop + 14);
  metaLine("Client ID", invoice.customer.clientId, metaTop + 28);

  doc.y = Math.max(doc.y, metaTop + 50);
  doc.fillColor("black");
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(PAGE_WIDTH - MARGIN, doc.y)
    .strokeColor("#cbd5e1")
    .stroke();
  doc.moveDown(0.8);

  if (invoice.marginVatScheme) {
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#92400e").text(INVOICE_MARGIN_NOTICE, {
      width: contentWidth,
    });
    doc.fillColor("black");
    doc.moveDown(0.8);
  }

  const colWidth = contentWidth / 3;
  const detailsTop = doc.y;
  doc.font("Helvetica").fontSize(8).fillColor("#64748b").text("BILLING DETAILS", MARGIN, detailsTop);
  doc
    .fillColor("black")
    .fontSize(9)
    .text(
      [
        invoice.customer.name,
        invoice.customer.businessName ?? "",
        invoice.customer.address ?? "",
        invoice.customer.phone ?? "",
        invoice.customer.email ?? "",
        invoice.customer.vatNumber ? `VAT Number: ${invoice.customer.vatNumber}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      MARGIN,
      detailsTop + 12,
      { width: colWidth - 10 },
    );

  doc
    .fontSize(8)
    .fillColor("#64748b")
    .text("SHIPPING DETAILS", MARGIN + colWidth, detailsTop);
  doc
    .fillColor("black")
    .fontSize(9)
    .text(
      [invoice.customer.name, invoice.customer.businessName ?? "", invoice.customer.shippingAddress || invoice.customer.address || "—"]
        .filter(Boolean)
        .join("\n"),
      MARGIN + colWidth,
      detailsTop + 12,
      { width: colWidth - 10 },
    );

  doc
    .fontSize(9)
    .fillColor("black")
    .text(
      [
        `Payment Terms: ${invoice.paymentTerms || "Immediate"}`,
        `Warranty Terms: ${invoice.warrantyTerms || "3 months"}`,
      ].join("\n"),
      MARGIN + colWidth * 2,
      detailsTop,
      { width: colWidth - 10 },
    );

  doc.y = Math.max(doc.y, detailsTop + 70);
  doc.moveDown(1);

  const cols = {
    qty: MARGIN,
    product: MARGIN + 30,
    color: MARGIN + 210,
    network: MARGIN + 280,
    grade: MARGIN + 350,
    price: MARGIN + 390,
    total: MARGIN + 460,
  };
  const tableWidth = contentWidth;

  function tableHeader() {
    const y = doc.y;
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#64748b");
    doc.text("Qty", cols.qty, y, { width: 25 });
    doc.text("Product", cols.product, y, { width: 175 });
    doc.text("Color", cols.color, y, { width: 65 });
    doc.text("Network", cols.network, y, { width: 65 });
    doc.text("Grade", cols.grade, y, { width: 35 });
    doc.text("Unit price", cols.price, y, { width: 65, align: "right" });
    doc.text("Total", cols.total, y, { width: PAGE_WIDTH - MARGIN - cols.total, align: "right" });
    doc.fillColor("black");
    doc.moveDown(0.6);
    doc
      .moveTo(MARGIN, doc.y)
      .lineTo(MARGIN + tableWidth, doc.y)
      .strokeColor("#94a3b8")
      .stroke();
    doc.moveDown(0.4);
  }

  function ensureSpace(rowHeight: number, onNewPage?: () => void) {
    if (doc.y + rowHeight > doc.page.height - MARGIN - 60) {
      doc.addPage();
      doc.y = MARGIN;
      onNewPage?.();
    }
  }

  tableHeader();
  for (const line of invoice.lines) {
    ensureSpace(20, tableHeader);
    doc.font("Helvetica").fontSize(9).fillColor("black");
    const y = doc.y;
    doc.text(String(line.qty), cols.qty, y, { width: 25 });
    doc.text(line.productName, cols.product, y, { width: 175 });
    doc.text(line.color, cols.color, y, { width: 65 });
    doc.text(line.network, cols.network, y, { width: 65 });
    doc.text(line.grade, cols.grade, y, { width: 35, align: "center" });
    doc.text(money(line.unitPriceGbp), cols.price, y, { width: 65, align: "right" });
    doc.text(money(line.qty * line.unitPriceGbp), cols.total, y, {
      width: PAGE_WIDTH - MARGIN - cols.total,
      align: "right",
    });
    doc.moveDown(0.9);
  }
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(MARGIN + tableWidth, doc.y)
    .strokeColor("#94a3b8")
    .stroke();
  doc.moveDown(0.4);
  ensureSpace(20);
  const qtyY = doc.y;
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a");
  doc.text(String(totals.totalQty), cols.qty, qtyY, { width: 25 });
  doc.text("Total quantity", cols.product, qtyY, { width: 175 });
  doc.fillColor("black");
  doc.moveDown(0.6);
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(MARGIN + tableWidth, doc.y)
    .strokeColor("#94a3b8")
    .stroke();
  doc.moveDown(0.6);

  ensureSpace(140);
  const summaryTop = doc.y;
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#64748b")
    .text("BANK DETAILS", MARGIN, summaryTop);
  doc
    .fillColor("#0f172a")
    .fontSize(9)
    .text(bankLines.join("\n"), MARGIN, summaryTop + 12, {
      width: contentWidth * 0.55,
    });
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(INVOICE_NUMBER_BG)
    .text(`Payment reference: ${invoice.invoiceNumber}`, MARGIN, doc.y + 8, {
      width: contentWidth * 0.55,
    });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#475569")
    .text(`You must enter ${invoice.invoiceNumber} as your payment reference.`, {
      width: contentWidth * 0.55,
    });

  const summaryColX = MARGIN + contentWidth * 0.6;
  const summaryColWidth = contentWidth * 0.4;
  let sy = summaryTop;
  const summaryRow = (label: string, value: string, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 9);
    doc.text(label, summaryColX, sy, { width: summaryColWidth * 0.5 });
    doc.text(value, summaryColX + summaryColWidth * 0.5, sy, {
      width: summaryColWidth * 0.5,
      align: "right",
    });
    sy += bold ? 20 : 16;
  };
  summaryRow("Subtotal", money(totals.subGbp));
  summaryRow("Total quantity", String(totals.totalQty));
  // Shipping is not a device, so it stays out of the item list and only shows
  // here when charged; a £0.00 row just crowds the totals.
  if (totals.shippingGbp > 0) {
    summaryRow(invoice.shippingLabel || "Shipping", money(totals.shippingGbp));
  }
  doc
    .moveTo(summaryColX, sy)
    .lineTo(summaryColX + summaryColWidth, sy)
    .strokeColor("#94a3b8")
    .stroke();
  sy += 6;
  summaryRow("Grand Total", money(totals.totalGbp), true);
  const dueBoxY = sy + 4;
  const dueBoxH = 28;
  const dueFill = tone === "paid" ? "#ECFDF5" : "#FEF2F2";
  const dueFg = tone === "paid" ? "#166534" : "#991B1B";
  doc.roundedRect(summaryColX, dueBoxY, summaryColWidth, dueBoxH, 4).fill(dueFill);
  doc
    .fillColor(dueFg)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Amount due", summaryColX + 8, dueBoxY + 8, { width: summaryColWidth * 0.45 });
  doc.text(money(totals.dueGbp), summaryColX + summaryColWidth * 0.45, dueBoxY + 8, {
    width: summaryColWidth * 0.55 - 8,
    align: "right",
  });
  sy = dueBoxY + dueBoxH;
  doc.fillColor("black");

  doc.y = Math.max(doc.y, sy) + 10;

  ensureSpace(30);
  doc.font("Helvetica").fontSize(7).fillColor("#64748b").text(INVOICE_INVALID_UNTIL_PAID_NOTICE, MARGIN, doc.y, {
    width: contentWidth,
  });
  doc.fillColor("black");

  doc.addPage();
  doc.font("Helvetica-Bold").fontSize(12).text("Invoice Notes", MARGIN, MARGIN);
  doc
    .font("Helvetica")
    .fontSize(8)
    .text(
      "Please read our terms before making the payment. By making payment you agree to below terms applied to sold stock on above invoice.",
      MARGIN,
      doc.y + 8,
      { width: contentWidth },
    );
  doc.moveDown(0.8);
  INVOICE_TERMS.forEach((term, index) => {
    ensureSpace(24);
    doc.font("Helvetica").fontSize(7.5).text(`${index + 1}. ${term}`, MARGIN, doc.y, {
      width: contentWidth,
    });
    doc.moveDown(0.4);
  });
  doc.moveDown(0.8);
  doc
    .fontSize(7.5)
    .text(`Company Registration number: ${seller.companyNo}\nEORI Number: ${seller.eoriNumber}`, MARGIN, doc.y, {
      width: contentWidth,
    });

  doc.end();
  return done;
}

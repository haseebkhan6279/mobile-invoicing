export function isLogAnalyticsQuery(query: string) {
  const n = query.trim().toLowerCase().replace(/\s+/g, " ");
  return (
    n === "log" ||
    n === "logs" ||
    n === "log analytics" ||
    n === "analytics" ||
    n === "activity log" ||
    n === "activity logs"
  );
}

export function pageActivityTitle(pathname: string) {
  if (pathname === "/") return "Opened dashboard";
  if (pathname === "/invoices") return "Opened invoices";
  if (pathname === "/invoices/new") return "Opened create invoice";
  if (pathname.startsWith("/invoices/") && pathname.endsWith("/print")) return "Opened invoice print";
  if (pathname.startsWith("/invoices/")) return "Opened an invoice";
  if (pathname === "/stock") return "Opened stock";
  if (pathname === "/stock/add") return "Opened add stock";
  if (pathname.startsWith("/stock/")) return "Opened a stock unit";
  if (pathname === "/customers") return "Opened customers";
  if (pathname === "/customers/new") return "Opened new customer";
  if (pathname.startsWith("/customers/")) return "Opened a customer";
  if (pathname === "/purchase-orders") return "Opened purchase orders";
  if (pathname.startsWith("/purchase-orders/")) return "Opened a purchase order";
  if (pathname === "/suppliers") return "Opened suppliers";
  if (pathname.startsWith("/suppliers/")) return "Opened a supplier";
  if (pathname === "/returns") return "Opened returns";
  if (pathname.startsWith("/returns/")) return "Opened an RMA";
  if (pathname === "/shipments") return "Opened shipments";
  if (pathname.startsWith("/shipments/")) return "Opened a shipment";
  if (pathname === "/search") return "Opened search";
  if (pathname === "/settings") return "Opened settings";
  if (pathname === "/log-analytics") return "Opened log analytics";
  return `Opened ${pathname}`;
}

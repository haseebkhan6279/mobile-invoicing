# ADS Wholesale Ops

Staff operations system for Atlantic Devices Solutions: purchase orders, IMEI stock, supplier hisab, customers, dual-currency invoices, RMA, shipping/tracking, and search.

The public catalog site (`mobile-ecommerce`) is a separate repo.

## Setup

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default login

- Email: `admin@ads.local`
- Password: `admin1234`

Change this after first login in production. Set `AUTH_SECRET` in `.env`.

## Modules

- **Suppliers** — credit / debit hisab and running balance (GBP + EUR)
- **Purchase orders** — auto `PO-0001`, receive stock by grade
- **Stock** — one row per IMEI, colour, network, grade, cost
- **Customers** — auto Client ID `CL-0001`, name autofetch on invoices
- **Invoices** — auto `INV-0001`, Pending / Awaiting payment / Paid, printable A4
- **Returns** — RMA against invoice IMEIs
- **Shipments** — tracking, quoted shipping vs actual courier cost
- **Search** — IMEI, invoice, PO, RMA, client ID, name, tracking

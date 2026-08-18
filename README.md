# ADS Wholesale Ops

Staff operations system for Atlantic Devices Solutions: purchase orders, IMEI stock, supplier hisab, customers, dual-currency invoices, RMA, shipping/tracking, and search.

The public catalog site (`mobile-ecommerce`) is a separate repo.

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env`.
3. In Supabase go to **Project Settings → Database** and paste:
   - **Transaction pooler** URI into `DATABASE_URL` (port `6543`). Add `?pgbouncer=true` if it is not already there.
   - **Direct** URI (or Session pooler, port `5432`) into `DIRECT_URL`.
4. Set `AUTH_SECRET` to a long random string.

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If migrate fails with an IPv6 / connection error, use the **Session pooler** URI for `DIRECT_URL`.

### Default login

- Email: `admin@ads.local`
- Password: `admin1234`

Change this after first login in production.

## Modules

- **Suppliers** — credit / debit hisab and running balance (GBP + EUR)
- **Purchase orders** — auto `PO-0001`, receive stock by grade
- **Stock** — one row per IMEI, colour, network, grade, cost
- **Customers** — auto Client ID `CL-0001`, name autofetch on invoices
- **Invoices** — auto `INV-0001`, Pending / Awaiting payment / Paid, printable A4
- **Returns** — RMA against invoice IMEIs
- **Shipments** — tracking, quoted shipping vs actual courier cost
- **Search** — IMEI, invoice, PO, RMA, client ID, name, tracking

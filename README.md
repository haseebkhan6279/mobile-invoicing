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

## Mobile REST API (`/api/v1`)

A JSON REST API lives under `src/app/api/v1/**` for the separate mobile app. It is purely
additive: the dashboard's pages and server actions are untouched and keep working exactly
as before. Every business rule (validation, number generation, IMEI checks, stock status
transitions, ledger math) lives once in `src/lib/services/*.ts`; both the dashboard's
server actions (`src/actions/*.ts`) and the API routes call those same functions.

### Auth

The API does not use the dashboard's cookie session. It issues its own signed JWTs (via
`jose`) verified with a dedicated `API_JWT_SECRET` — independent from the web session's
`AUTH_SECRET`, so either can be rotated without affecting the other.

**1. Log in**

```
POST /api/v1/auth/login
{ "email": "admin@ads.local", "password": "admin1234" }
```

```json
{
  "data": {
    "user": { "id": "...", "email": "...", "name": "..." },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 43200,
    "tokenType": "Bearer"
  }
}
```

- `accessToken` — send as `Authorization: Bearer <accessToken>` on every other request. Expires in **12h**.
- `refreshToken` — expires in **30d**. Exchange it for a new pair before (or after) the access token expires.

**2. Refresh**

```
POST /api/v1/auth/refresh
{ "refreshToken": "eyJ..." }
```

Returns the same shape as login (a fresh access + refresh token pair).

Every other `/api/v1/**` route requires `Authorization: Bearer <accessToken>` and returns
`401` if it's missing, malformed, expired, or the user no longer exists.

### Response envelope

- Success: `{ "data": <result> }`
- Error: `{ "error": { "message": "..." } }` — never a stack trace or raw Prisma error.
- Status codes: `400` validation, `401` auth, `404` not found, `409` conflict (e.g. an
  IMEI that's already in stock), `500` unexpected.

### CORS

- Allow-list comes from `MOBILE_APP_ORIGIN` (comma-separated), defaulting to the
  Expo/Metro dev origins `http://localhost:8081,http://localhost:19006` if unset.
- Any `https://*.vercel.app` preview origin is auto-allowed.
- Requests with no `Origin` header (native app, server-to-server) are always let through.
- `Access-Control-Allow-Credentials: true` is set and the matching origin is echoed back
  exactly (never `*`, since credentials are involved).
- Every `/api/v1/**` route answers `OPTIONS` preflight.

### Endpoints

| Method | Path | Body / query | Notes |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | `{ email, password }` | public |
| POST | `/api/v1/auth/refresh` | `{ refreshToken }` | public |
| GET | `/api/v1/customers` | `?q=` optional search (top 8) | no `q` → full list |
| GET | `/api/v1/customers/:id` | | includes `invoices` |
| POST | `/api/v1/customers` | see below | |
| PATCH | `/api/v1/customers/:id` | see below | |
| GET | `/api/v1/invoices` | `?status=PENDING\|AWAITING_PAYMENT\|PAID` | |
| GET | `/api/v1/invoices/:id` | | includes `customer`, `lines`, `stockUnits`, `shipments` |
| POST | `/api/v1/invoices` | see below | validates IMEI count/dupes/availability |
| PATCH | `/api/v1/invoices/:id` | `{ status }` | flips stock to `RESERVED`/`SOLD` |
| GET | `/api/v1/purchase-orders` | | |
| GET | `/api/v1/purchase-orders/:id` | | |
| POST | `/api/v1/purchase-orders` | see below | |
| PATCH | `/api/v1/purchase-orders/:id` | `{ status, notes, shippingCostGbp, shippingCostEur, actualCostGbp, actualCostEur, fxRate }` | |
| POST | `/api/v1/purchase-orders/:id/receive` | `{ supplierId?, batches }` | ledger always posted (`postLedger` forced on) |
| GET | `/api/v1/stock` | `?status=&grade=&q=` | |
| POST | `/api/v1/stock` | see below | `409` if an IMEI already exists |
| GET | `/api/v1/suppliers` | | includes `ledger`, `_count.purchaseOrders` |
| GET | `/api/v1/suppliers/:id` | | includes `ledger`, `purchaseOrders` |
| POST | `/api/v1/suppliers` | `{ name, phone?, email?, address?, vatNumber?, notes? }` | |
| PATCH | `/api/v1/suppliers/:id` | same as create | |
| DELETE | `/api/v1/suppliers/:id` | | `409` if it has POs/stock on record |
| POST | `/api/v1/suppliers/:id/ledger` | `{ type: "CREDIT"\|"DEBIT", amountGbp, amountEur, date?, reference?, notes? }` | |
| GET | `/api/v1/rma` | | |
| GET | `/api/v1/rma/:id` | | |
| POST | `/api/v1/rma` | `{ invoiceId, reason?, notes?, items: [{ stockUnitId, action?, reason? }] }` | |
| PATCH | `/api/v1/rma/:id` | `{ status }` | `RECEIVED`/`CLOSED`/`REFUNDED` restocks or write-offs units |
| POST | `/api/v1/rma/:id/credit` | `{ paymentType, appliedInvoiceId?, paymentAmountGbp?, paymentAmountEur?, paymentDate? }` | |
| GET | `/api/v1/shipments` | | |
| GET | `/api/v1/shipments/:id` | | |
| POST | `/api/v1/shipments` | `{ invoiceId, trackingNumber?, carrier?, shippingCostGbp?, shippingCostEur?, actualCostGbp?, actualCostEur?, status?, notes? }` | |
| PATCH | `/api/v1/shipments/:id` | same as create (minus `invoiceId`) | |
| GET | `/api/v1/search` | `?q=` | searches stock, invoices, customers, POs, RMAs, shipments, suppliers |

### Key request bodies

**Create customer / update customer**
```json
{
  "name": "Acme Ltd",
  "businessName": null,
  "phone": null,
  "email": null,
  "vatNumber": null,
  "address": null,
  "shippingAddress": null,
  "notes": null
}
```

**Create invoice** — `imeis.length` must equal `qty` for every line, no duplicate IMEIs
across the invoice, and every IMEI must exist and be `IN_STOCK` (else `400`/`409`).
```json
{
  "customerId": "clxxx",
  "status": "PENDING",
  "fxRate": 1.15,
  "shippingCostGbp": 0,
  "shippingCostEur": 0,
  "shippingLabel": null,
  "paymentTerms": "Immediate",
  "warrantyTerms": "3 months",
  "notes": null,
  "lines": [
    {
      "productName": "iPhone 13",
      "color": "Black",
      "network": "Unlocked",
      "grade": "A",
      "qty": 2,
      "unitPriceGbp": 300,
      "unitPriceEur": 345,
      "imeis": ["356789101234567", "356789101234568"]
    }
  ]
}
```

**Create purchase order**
```json
{
  "supplierId": "clxxx",
  "status": "ORDERED",
  "notes": null,
  "shippingCostGbp": 0,
  "shippingCostEur": 0,
  "fxRate": 1.15,
  "lines": [
    { "productName": "iPhone 13", "color": "Black", "network": "Unlocked", "grade": "A", "qty": 10, "unitCostGbp": 200, "unitCostEur": 230 }
  ]
}
```

**Add stock batch** (`POST /api/v1/stock` or `POST /api/v1/purchase-orders/:id/receive`,
where `purchaseOrderId` comes from the URL instead of the body) — duplicate IMEIs within
the request are `400`, an IMEI already on file is `409`.
```json
{
  "supplierId": "clxxx",
  "purchaseOrderId": null,
  "postLedger": true,
  "batches": [
    {
      "productName": "iPhone 13",
      "brand": "Apple",
      "color": "Black",
      "network": "Unlocked",
      "grade": "A",
      "costGbp": 200,
      "costEur": 230,
      "imeis": ["356789101234567", "356789101234568"]
    }
  ]
}
```

### Env vars

Add these alongside the existing ones (see `.env.example`):

- `API_JWT_SECRET` — signing secret for the API's JWTs. Generate with `openssl rand -base64 32`. Keep it different from `AUTH_SECRET`.
- `MOBILE_APP_ORIGIN` — comma-separated browser origins allowed to call the API with credentials (native app requests don't need this).

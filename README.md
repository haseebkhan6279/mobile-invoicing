# ADS Wholesale Ops

Staff operations system for Atlantic Devices Solutions: purchase orders, IMEI stock, supplier hisab, customers, dual-currency invoices, RMA, shipping/tracking, and search.

The public catalog site (`mobile-ecommerce`) is a separate repo.

## Structure

This is an npm-workspaces monorepo of two independently deployable apps:

```
api/          NestJS + Prisma/Postgres — the REST API, owns the database entirely
dashboard/    Next.js — the staff web dashboard, talks to api/ over HTTP only
```

Nothing else touches Postgres directly, and the dashboard has no Prisma dependency —
every read/write goes through `api/`'s HTTP endpoints. A separate mobile app also talks
to the same `api/`.

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `api/.env.example` to `api/.env` and `dashboard/.env.example` to `dashboard/.env`.
3. In Supabase go to **Project Settings → Database** and paste into `api/.env`:
   - **Transaction pooler** URI into `DATABASE_URL` (port `6543`). Add `?pgbouncer=true` if it is not already there.
   - **Direct** URI (or Session pooler, port `5432`) into `DIRECT_URL`.
4. Set `AUTH_SECRET` (in `dashboard/.env`) and `API_JWT_SECRET` (in `api/.env`) to two
   different long random strings — `openssl rand -base64 32`.

```bash
npm install
npm run db:migrate --workspace=api
npm run db:seed --workspace=api
npm run dev:api        # terminal 1 — http://localhost:3000
npm run dev:dashboard  # terminal 2 — http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173). The dashboard calls the API at
`API_URL` (defaults to `http://localhost:3000/api/v1`).

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

## REST API (`api/`, mounted at `/api/v1`)

A NestJS app, structured as one module per resource
(`api/src/<resource>/{*.controller,*.service,dto/*}.ts`), backed by Prisma/Postgres.
Both the staff dashboard and the separate mobile app are just HTTP clients of this API —
there is exactly one implementation of every business rule (validation, number
generation, IMEI checks, stock status transitions, ledger math), living in the
`*.service.ts` files.

Runs on `PORT` (default `3000`); every route is mounted under the `/api/v1` prefix
except `GET /health`.

### Auth

Stateless JWTs signed with `@nestjs/jwt`, verified via a `passport-jwt` strategy, using
a dedicated `API_JWT_SECRET` — independent from the dashboard's own `AUTH_SECRET`
(the dashboard's NextAuth session internally holds a copy of the API's access/refresh
tokens so its server actions and pages can call the API on the signed-in user's behalf;
see `dashboard/src/auth.ts`).

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
`401` if it's missing, malformed, expired, or the user no longer exists (re-checked on
every request, not just trusted from the token payload).

### Response envelope

- Success: `{ "data": <result> }`
- Error: `{ "error": { "message": "..." } }` — never a stack trace or raw Prisma error.
- Status codes: `400` validation, `401` auth, `404` not found, `409` conflict (e.g. an
  IMEI that's already in stock), `500` unexpected.

### CORS

- Allow-list comes from `CORS_ORIGIN` (comma-separated, in `api/.env`), defaulting to
  the dashboard's dev origin plus the Expo/Metro dev origins:
  `http://localhost:5173,http://localhost:8081,http://localhost:19006`.
- Any `https://*.vercel.app` preview origin is auto-allowed.
- Requests with no `Origin` header (native app, server-to-server) are always let through.
- `Access-Control-Allow-Credentials: true` is set and the matching origin is echoed back
  exactly (never `*`, since credentials are involved). A disallowed-but-present origin
  is rejected server-side (`500` on the preflight) rather than silently stripped.

### Endpoints

| Method | Path | Body / query | Notes |
| --- | --- | --- | --- |
| GET | `/health` | | no `/api/v1` prefix, no auth |
| POST | `/api/v1/auth/login` | `{ email, password }` | public |
| POST | `/api/v1/auth/refresh` | `{ refreshToken }` | public |
| GET | `/api/v1/lookups` | | grades, colors, networks, suppliers, customers (dropdown data) |
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
| GET | `/api/v1/stock/available-imeis` | `?productName=&color=&network=&grade=&limit=` | in-stock IMEIs matching a spec |
| GET | `/api/v1/stock/search-products` | `?q=` | grouped product/grade typeahead |
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

### `api/` env vars (`api/.env`)

- `DATABASE_URL` / `DIRECT_URL` — Postgres (Supabase).
- `PORT` — default `3000`.
- `API_JWT_SECRET` — signing secret for the API's JWTs. Different from the dashboard's `AUTH_SECRET`.
- `CORS_ORIGIN` — comma-separated browser origins allowed to call the API with credentials.

### `dashboard/` env vars (`dashboard/.env`)

- `AUTH_SECRET` / `AUTH_URL` — NextAuth session (cookie-based, web-only).
- `API_URL` — base URL of `api/`, e.g. `http://localhost:3000/api/v1`.

**Mobile app developers:** point your HTTP client at the `api/` origin (`http://localhost:3000` in dev) — the `/api/v1/**` paths and request/response shapes above are the full contract.

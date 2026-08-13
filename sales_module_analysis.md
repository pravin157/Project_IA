# Sales Module — Implementation Verification Report

**Project:** `Project_IA` (Next.js Frontend) + `Paymaster` (Backend Service)
**Analysis Date:** 2026-08-12
**Scope:** Full end-to-end verification of the Sales Module — all pages, API calls, service layer, backend handlers, and application logic.

---

## 1. Module Architecture Overview

```
src/
├── modules/sales/                      ← UI Module (Next.js "use client")
│   ├── index.ts                        ← Barrel export
│   └── pages/
│       ├── SalesDashboardPage.tsx      ← Subscription extension
│       ├── ReceiptGeneratorPage.tsx    ← Manual receipt generation
│       ├── CouponsListPage.tsx         ← Coupon listing & deletion
│       └── CreateDiscountPage.tsx      ← Coupon creation
│
├── services/
│   └── salesService.ts                 ← Service façade (10 operations)
│
├── api/
│   ├── common/
│   │   ├── apiClient.ts                ← Axios instance + interceptors
│   │   └── endpoints.ts                ← Endpoint constants
│   └── sales/                          ← Individual API call functions
│       ├── getOrganizations.ts
│       ├── getSubscriptionDetails.ts
│       ├── extendSubscription.ts
│       ├── createDiscount.ts
│       ├── getCoupons.ts
│       ├── deleteCoupon.ts
│       ├── generateReceipt.ts          ← ⚠️ DEAD CODE (never called)
│       ├── getPaymentGatewayDetails.ts
│       ├── getOrganizationByAccountId.ts
│       └── createManualReceipt.ts
│
└── app/dashboard/sales/               ← Next.js App Router pages
    ├── page.tsx                        → renders SalesDashboardPage
    ├── receipt/page.tsx                → renders ReceiptGeneratorPage
    ├── coupons/page.tsx                → renders CouponsListPage
    └── discount/page.tsx               → renders CreateDiscountPage
```

**Paymaster Backend (d:/Intern/Paymaster/src/):**
```
handlers/
├── admin-apis.ts       ← Routes: EXTEND_SUBSCRIPTION_DATE, CREATE_MANUAL_RECEIPT,
│                               CREATE_DISCOUNT_COUPON, GET_DISCOUNT_COUPONS,
│                               DELETE_DISCOUNT_COUPON
└── subscriptions.ts    ← Routes: GET_ORGANIZATION_SUBSCRIPTION_DETAILS,
                                GET_ORGANIZATIONS_WITH_USER_COUNT, and 20+ more

application/
├── admin-manual-receipt.ts   ← CREATE_MANUAL_RECEIPT business logic
└── subscriptions.ts          ← All other subscription/coupon business logic
```

---

## 2. API Endpoint Map

| Frontend Route | Next.js Proxy | Backend Handler | Event Type |
|---|---|---|---|
| `/api/paymaster` | `ENDPOINTS.SALES.PAYMASTER` | `subscriptions.ts` | Multiple |
| `/api/paymaster-admin` | `ENDPOINTS.SALES.PAYMASTER_ADMIN` | `admin-apis.ts` | Multiple |
| `/api/session` | `ENDPOINTS.SALES.SESSION` | Userhub service | Multiple |

### Sales Module Event Type Registry

| Operation | Endpoint | Event Type | Handler |
|---|---|---|---|
| List all organizations | `/paymaster` | `GET_ORGANIZATIONS_WITH_USER_COUNT` | `subscriptions.ts` |
| Get subscription details | `/paymaster` | `GET_ORGANIZATION_SUBSCRIPTION_DETAILS` | `subscriptions.ts` |
| Extend subscription | `/paymaster-admin` | `EXTEND_SUBSCRIPTION_DATE` | `admin-apis.ts` |
| Create manual receipt | `/paymaster-admin` | `CREATE_MANUAL_RECEIPT` | `admin-apis.ts` |
| Get coupons list | `/paymaster-admin` | `GET_DISCOUNT_COUPONS` | `admin-apis.ts` |
| Create discount coupon | `/paymaster-admin` | `CREATE_DISCOUNT_COUPON` | `admin-apis.ts` |
| Delete discount coupon | `/paymaster-admin` | `DELETE_DISCOUNT_COUPON` | `admin-apis.ts` |
| Get org by account ID | `/session` | `GET_ORGANIZATION_BY_ACCOUNT_ID` | Userhub |
| Get payment gateway details | `/session` | `FETCH_PAYMENT_GATEWAY_DETAILS` | Userhub |

---

## 3. Feature-by-Feature Verification

---

### 3.1 — Subscription Management (`SalesDashboardPage.tsx`)

**Purpose:** Load all organizations alphabetically, select one to view its subscription info, and extend the subscription to a new date.

#### Data Flow
```
[Mount] → getOrganizations() → POST /paymaster { eventType: "GET_ORGANIZATIONS_WITH_USER_COUNT" }
                             ↓
                       setOrganizations(sorted)

[Select Company] → getSubscriptionDetails(orgId) → POST /paymaster { eventType: "GET_ORGANIZATION_SUBSCRIPTION_DETAILS" }
                                                  ↓
                                            setCurrentSubscription(sub)

[Form Submit] → extendSubscription({ organizationId, subscriptionId, extendedToDate })
             → POST /paymaster-admin { eventType: "EXTEND_SUBSCRIPTION_DATE", ...params }
             ↓
       On success code "SUBSCRIPTION_EXPIRY_EXTENDED" → refresh subscription + show modal
```

#### ✅ Correctly Implemented
- Organizations fetched on mount and sorted alphabetically by `organizationName`.
- Subscription auto-fetches when a company is selected.
- Date input enforces `min` attribute calculated as `validTill + 1 day` — prevents selecting a date before or on current expiry.
- `handleSubmit` correctly guards: requires `selectedCompanyId`, `extensionDate`, and `currentSubscription`.
- `extendSubscriptionApi` validates the response code (`SUBSCRIPTION_EXPIRY_EXTENDED`) and throws on failure — error handled in UI.
- Success modal with refreshed subscription data correctly shown.
- Loading/error states handled for both org list and subscription fetches.

#### ⚠️ Issues / Observations
| # | Severity | Issue |
|---|---|---|
| 1 | Low | `organizations` and `currentSubscription` are typed as `any[]` / `any` — no TypeScript interface defined, making it fragile to API shape changes. |
| 2 | Low | The `isSuccess` flag resets after 5 seconds but the success modal must be manually closed. If user dismisses immediately, the 5 second timeout still fires — harmless but inconsistent. |
| 3 | Low | If `handleSelectCompany` is called with empty string (user deselects), it calls `setCurrentSubscription(null)` but doesn't reset `subscriptionError`, which may show a stale error. |

---

### 3.2 — Receipt Generator (`ReceiptGeneratorPage.tsx`)

**Purpose:** Verify an organization by AEC ID, collect receipt details, call the backend to create a manual receipt, and open the generated receipt URL in a new tab.

#### Data Flow
```
[AEC ID Input + "Verify"] → getOrganizationByAccountId(aecId)
                          → POST /session { eventType: "GET_ORGANIZATION_BY_ACCOUNT_ID", accountId }
                          ↓
                    setOrganizations([org])  |  setOrgError(...)

[Country Code Input (2 chars)] → (useEffect) → getPaymentGatewayDetails(countryCode)
                               → POST /session { eventType: "FETCH_PAYMENT_GATEWAY_DETAILS", countryCode }
                               ↓
                         setCurrencySymbol / setCurrencyCode / setCountryName

[Form Submit] → validation → createManualReceipt(receiptData)
             → POST /paymaster-admin { eventType: "CREATE_MANUAL_RECEIPT", ...payload }
             ↓
       response.body.receiptId → open https://app.aecplayhouse.com/subscription/receipt?receiptId=...
       → saveHistory(newReceipt) in localStorage
```

#### Payload Mapping (Frontend → Backend)

| Frontend Field | Mapped Key | Transform |
|---|---|---|
| `formData.aecId` | `aecNumber` | `.trim()` |
| `formData.dateTime` | `paidOn` | `formatPaidOn()` → `DD-MM-YYYY HH:mm:ss` |
| `formData.amount` | `amountPaid` | `Number()` |
| `formData.duration` | `duration` | `mapDuration()` → `ANNUAL / MONTHLY / QUARTERLY / HALF_YEARLY` |
| `formData.numberOfUsers` | `numUsers` | `Number()` |
| `formData.countryCode` | `country` | `.toUpperCase()` |
| `formData.planName` | `planName` | `mapPlanName()` → `ALL_IN_ONE_PLAN` etc. |
| `selectedOrganizationId` | `organizationId` | Direct |
| `org.organizationName` | `name` | Optional |
| `org.emailAddress` | `email` | Optional |

#### Backend Business Logic (`admin-manual-receipt.ts`)

The backend performs the following steps:
1. Validates request via Joi schema (`validateCreateManualSubscriptionReceipt`)
2. Parses `paidOn` date in IST timezone (`moment-timezone`)
3. Allocates unique `couponCode` and `paymentRef` with collision detection (up to 8 retries)
4. Looks up `SubscriptionPlans` by `planName` + `country` (or `GLOBAL` fallback)
5. Calculates progressive user-tier pricing using `SubscriptionBillingPeriodBasedDiscounts`
6. Computes recurring discount as: `afterStandardDisc - paidBeforeTax`
7. Validates `recurringDisc > 0` — **rejects if paid amount >= standard price**
8. Validates rounding to ±0.01
9. Persists via `persistManualSubscriptionReceipt`
10. Returns `receiptId`, `sphId`, and financial summary

#### ✅ Correctly Implemented
- Org verification is a mandatory pre-step; form submission is blocked without `selectedOrganizationId`.
- Client-side validation on all fields before API call.
- Pre-opened tab (`window.open('about:blank', '_blank')`) avoids popup blocker issue.
- Currency symbol detection is automatic via country code and debounced to `countryCode.length === 2`.
- Receipt history is persisted to `localStorage` with search capability.
- `mapDuration()` correctly maps human-readable values to backend enum values.
- `mapPlanName()` uses `.toUpperCase().replace(/\s+/g, '_')` — consistent with backend format.
- Backend `DURATION_TO_TENURE` covers all four durations: `MONTHLY`, `QUARTERLY`, `HALF_YEARLY`, `ANNUAL`.

#### ⚠️ Issues / Observations

| # | Severity | Issue |
|---|---|---|
| 1 | **High** | `generateReceipt.ts` exists in `src/api/sales/` with a `GenerateReceiptParams` interface and `eventType: 'GENERATE_RECEIPT'` — but this is **never called** by `ReceiptGeneratorPage`. The page uses `createManualReceipt` instead. The `generateReceipt.ts` file is a dead/orphaned API file that adds confusion. `salesService.generateReceipt()` is exported but never consumed in any page. |
| 2 | **Medium** | The `ReceiptGeneratorPage` checks `response.body.receiptId` for success, but the `createManualReceiptApi` does **no response code validation** (unlike other APIs that check `data.code`). If the backend returns a non-200 but still has a `body`, the frontend won't detect the error. |
| 3 | **Medium** | The backend rejects if `recurringDisc <= 0` — meaning the `amountPaid` must be strictly less than the standard tier total. This is a non-obvious constraint not surfaced to the user in the UI. If a user enters an amount equal to or greater than the expected price, they'll get a backend error with a technical message. |
| 4 | Low | Receipt history is stored in `localStorage` under key `intoaec_receipt_history`. This means history is **browser/device-specific** and not persisted server-side. Admins on different browsers/devices will see different histories. |
| 5 | Low | Sample data uses hardcoded IDs like `REC-2026-88101` — these won't resolve to real backend receipts if the receipt URL link is clicked in the initial state. |
| 6 | Low | `countryName` is shown via `setCountryName(details.countryName)` but on gateway fetch error, it's reset to `''` — no error message, so users won't know why the country name disappeared. |

---

### 3.3 — Coupons List (`CouponsListPage.tsx`)

**Purpose:** Fetch all discount coupons, display in a searchable table, and allow deletion with confirmation.

#### Data Flow
```
[Mount + Refresh] → getCoupons() → POST /paymaster-admin { eventType: "GET_DISCOUNT_COUPONS" }
                                 ↓ expects code "DISCOUNT_COUPONS_RETRIEVED"
                           setCoupons(data.body || [])

[Delete Button] → setDeletingId(couponId)  (inline confirmation state)
[Confirm Delete] → deleteCoupon({ couponId, couponCode })
               → POST /paymaster-admin { eventType: "DELETE_DISCOUNT_COUPON", couponId, couponCode }
               ↓ expects code "DISCOUNT_COUPON_DELETED"
          setCoupons(prev.filter(...))  // optimistic removal
```

#### ✅ Correctly Implemented
- Inline delete confirmation (two-step: click trash → "Are you sure?" → confirm/cancel) prevents accidental deletion.
- `useMemo` used for search filter — performant for large coupon lists.
- Fetch on mount and refresh button both call the same `fetchCoupons` function.
- Error and success messages rendered with 5-second auto-dismiss for success.
- Empty state distinguishes between "no coupons" and "no search results".
- Link to `/dashboard/sales/discount` for creating new coupons — correctly wired to `CreateDiscountPage`.
- `getCouponsApi` validates response code `DISCOUNT_COUPONS_RETRIEVED`.
- `deleteCouponApi` validates response code `DISCOUNT_COUPON_DELETED`.

#### ⚠️ Issues / Observations

| # | Severity | Issue |
|---|---|---|
| 1 | **Medium** | The `Coupon` interface has `couponDiscountUnit: 'PERCENTAGE' \| 'AMOUNT'` but the UI always renders `{coupon.couponDiscountValue}%` — it does **not** check `couponDiscountUnit`. If a coupon with `AMOUNT` unit is returned, it will display incorrectly (e.g., `50%` instead of `$50`). |
| 2 | Low | `createdAt` is cast via `new Date(Number(coupon.createdAt))` — this assumes it's an epoch timestamp in milliseconds. If the API returns an ISO string, `Number()` will return `NaN`. |
| 3 | Low | `isDeleting` is a single boolean shared across all coupons. If a delete is in progress, another row's `deletingId` can still be set, causing two rows to show the confirmation UI simultaneously. |

---

### 3.4 — Create Discount Coupon (`CreateDiscountPage.tsx`)

**Purpose:** Form to create a new percentage-based discount coupon with optional recurring behavior.

#### Data Flow
```
[Form Submit] → createDiscount({ couponCode, discountUnit: 'PERCENTAGE', discountValue, isRecurringDiscount })
             → POST /paymaster-admin { eventType: "CREATE_DISCOUNT_COUPON", ...params }
             ↓ expects code "DISCOUNT_COUPON_CREATED"
       setIsSuccess(true) → form reset
```

#### ✅ Correctly Implemented
- `discountUnit` is hardcoded to `'PERCENTAGE'` — matches what the UI exposes (percentage-only input).
- `couponCode` input uses `pattern="[a-zA-Z0-9]+"` for alphanumeric validation.
- Discount value uses `min=0`, `max=100`, `step=0.01` — accurate for percentage.
- Radio buttons for `isRecurringDiscount` correctly parse `value === 'true'` to boolean.
- Form is reset after success. Success indicator auto-dismisses after 5 seconds.
- `createDiscountApi` validates response code `DISCOUNT_COUPON_CREATED`.

#### ⚠️ Issues / Observations

| # | Severity | Issue |
|---|---|---|
| 1 | Low | The `CreateDiscountParams` interface allows `discountUnit: 'PERCENTAGE' \| 'AMOUNT'` but the form always passes `'PERCENTAGE'`. The type is unnecessarily broad. |
| 2 | Low | There's no navigation back to the coupons list after a successful creation. A "View Coupons" link on the success state would improve UX. |
| 3 | Low | `couponCode` input has CSS `uppercase` for visual styling, but the actual submitted value is whatever the user typed. Backend should normalize the case. |

---

## 4. Service Layer Verification (`salesService.ts`)

| Method | API Function | Status |
|---|---|---|
| `getOrganizations()` | `getOrganizationsApi()` | ✅ Used by SalesDashboardPage |
| `getSubscriptionDetails(orgId)` | `getSubscriptionDetailsApi(orgId)` | ✅ Used by SalesDashboardPage |
| `extendSubscription(params)` | `extendSubscriptionApi(params)` | ✅ Used by SalesDashboardPage |
| `createDiscount(params)` | `createDiscountApi(params)` | ✅ Used by CreateDiscountPage |
| `getCoupons()` | `getCouponsApi()` | ✅ Used by CouponsListPage |
| `deleteCoupon(params)` | `deleteCouponApi(params)` | ✅ Used by CouponsListPage |
| `generateReceipt(params)` | `generateReceiptApi(params)` | ❌ **NEVER USED** — dead code |
| `getPaymentGatewayDetails(code)` | `getPaymentGatewayDetailsApi(code)` | ✅ Used by ReceiptGeneratorPage |
| `getOrganizationByAccountId(id)` | `getOrganizationByAccountIdApi(id)` | ✅ Used by ReceiptGeneratorPage |
| `createManualReceipt(params)` | `createManualReceiptApi(params)` | ✅ Used by ReceiptGeneratorPage |

---

## 5. API Client Verification (`apiClient.ts`)

- ✅ Base URL is `/api` — proxies via Next.js to backend services.
- ✅ `withCredentials: true` — session cookies included in all requests.
- ✅ Response interceptor double-parses stringified JSON responses.
- ✅ Error interceptor standardizes error messages from `data.error`, `data.message`, or `error.message`.
- ✅ Custom `ApiClientError` class carries `status` and `code`.

---

## 6. Backend Handler Routing Verification

### `admin-apis.ts` Handler
| Event Type | Application Function | Status |
|---|---|---|
| `EXTEND_SUBSCRIPTION_DATE` | `extendSubscriptionDate()` | ✅ Routed |
| `CREATE_MANUAL_RECEIPT` | `createManualSubscriptionReceipt()` | ✅ Routed |
| `CREATE_DISCOUNT_COUPON` | `createDiscountCoupon()` | ✅ Routed |
| `GET_DISCOUNT_COUPONS` | `getDiscountCoupons()` | ✅ Routed |
| `DELETE_DISCOUNT_COUPON` | `deleteDiscountCoupon()` | ✅ Routed |

### `subscriptions.ts` Handler (relevant to Sales)
| Event Type | Application Function | Status |
|---|---|---|
| `GET_ORGANIZATION_SUBSCRIPTION_DETAILS` | `getOrganizationSubscriptionDetails()` | ✅ Routed |
| `GET_ORGANIZATIONS_WITH_USER_COUNT` | `syncOrganizationUserCounts()` | ✅ Routed |

> **Note:** `CREATE_DISCOUNT_COUPON` is registered in **both** `admin-apis.ts` and `subscriptions.ts` handlers. The frontend correctly targets `admin-apis.ts` via the `/paymaster-admin` endpoint. The duplicate in `subscriptions.ts` is a legacy artifact.

---

## 7. Consolidated Issues Summary

| ID | Feature | Severity | Description |
|---|---|---|---|
| I-1 | Receipt Generator | 🔴 High | `generateReceipt.ts` + `salesService.generateReceipt()` are dead/orphaned code — never called anywhere |
| I-2 | Receipt Generator | 🟡 Medium | `createManualReceiptApi` has no response code validation — success assumed if `body.receiptId` exists |
| I-3 | Receipt Generator | 🟡 Medium | Backend rejects if `amountPaid >= standardPrice` but this constraint is invisible in the UI |
| I-4 | Coupons List | 🟡 Medium | Discount unit ignored in render — AMOUNT type coupons will show `%` incorrectly |
| I-5 | Subscription Mgmt | 🟢 Low | `organizations` and `currentSubscription` typed as `any` — no TypeScript interfaces |
| I-6 | Subscription Mgmt | 🟢 Low | `subscriptionError` not reset when user deselects company |
| I-7 | Coupons List | 🟢 Low | `createdAt` cast via `Number()` — will break if API returns ISO string |
| I-8 | Coupons List | 🟢 Low | `isDeleting` shared across all rows — can show two-confirmation UI simultaneously |
| I-9 | Create Discount | 🟢 Low | `discountUnit` type allows `AMOUNT` but UI never supports it |
| I-10 | Create Discount | 🟢 Low | No post-creation navigation/link to coupon list |
| I-11 | Receipt History | 🟢 Low | `localStorage`-based history is device/browser-specific |
| I-12 | Backend | 🟢 Low | `CREATE_DISCOUNT_COUPON` duplicated in both handlers |

---

## 8. Data Flow Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│  Project_IA — Next.js Frontend (port 3000)                           │
│                                                                      │
│  SalesDashboardPage  ───────┐                                        │
│  ReceiptGeneratorPage ──────┤ salesService.ts                        │
│  CouponsListPage ───────────┤   │                                    │
│  CreateDiscountPage ────────┘   │                                    │
│                                 ↓                                    │
│                     api/sales/*.ts  +  apiClient.ts (Axios)          │
│                                 ↓                                    │
│   /api/paymaster  /api/paymaster-admin  /api/session                 │
│        (Next.js Route Handlers — act as reverse proxy)               │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ HTTP POST
┌──────────────────────────────▼───────────────────────────────────────┐
│  Paymaster Backend (port 9097)                                        │
│                                                                      │
│  handlers/subscriptions.ts   handlers/admin-apis.ts   (Userhub API) │
│          ↓                            ↓                              │
│  application/subscriptions.ts  admin-manual-receipt.ts               │
│          ↓                            ↓                              │
│      repository/subscriptions.ts → PostgreSQL DB                     │
│                  SubscriptionPlans, BillingPeriodDiscounts,           │
│                  PaymentHistory, OrganizationSPH                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 9. Overall Implementation Verdict

| Feature | Status | Notes |
|---|---|---|
| Subscription Management | ✅ **Fully Implemented** | All flows correct |
| Receipt Generator | ✅ **Implemented** (with caveats) | Dead `generateReceipt` code, missing response validation |
| Coupons List | ✅ **Implemented** (with caveats) | `couponDiscountUnit` not checked in render |
| Create Discount | ✅ **Fully Implemented** | Minor UX polish needed |
| Service Layer | ✅ **Complete** | 1 dead method (`generateReceipt`) |
| API Client | ✅ **Correct** | Robust error handling, credential forwarding |
| Backend Routing | ✅ **Correct** | All 7 sales events routed and handled |
| Backend Business Logic | ✅ **Correct** | Progressive tier pricing, collision-safe codes |

---

## 10. Recommendations

1. **Remove `generateReceipt.ts`** — delete the dead API file and `salesService.generateReceipt()` to eliminate confusion.
2. **Add response code validation to `createManualReceiptApi`** — check for a specific success code similar to other API functions.
3. **Surface pricing constraint in the UI** — show an estimated minimum amount so admins understand why the backend may reject their input.
4. **Fix `couponDiscountUnit` rendering** in `CouponsListPage` — conditionally render `%` or currency symbol.
5. **Define TypeScript interfaces** for `Organization`, `Subscription`, and `Coupon` objects shared across pages.
6. **Remove duplicate `CREATE_DISCOUNT_COUPON`** from `subscriptions.ts` handler since it belongs only to `admin-apis.ts`.
7. **Add post-creation navigation** in `CreateDiscountPage` — a "View All Coupons" button on the success state.

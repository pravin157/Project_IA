# 🔌 Project_IA — API Routing, Usage & Proxy Reference Guide

This document provides complete documentation of the application's API architecture, Next.js server route handlers, client-side calling utilities, and downstream microservice proxy mappings.

---

## 1. API Architecture Overview (BFF Pattern)

Project_IA utilizes a **Backend-For-Frontend (BFF) Proxy Pattern**. Instead of the client browser directly hitting external microservices, all client requests are routed through Next.js server-side route handlers (`/api/*`).

### Advantages:
1. **Security**: Sensitive credentials (e.g., API keys for AECAutopilot and Paymaster) are stored securely as environment variables on the server and are never exposed to the client.
2. **CORS Resolution**: Avoids Cross-Origin Resource Sharing restrictions between the browser and third-party microservices.
3. **Session Interception**: Next.js Edge Middleware (`middleware.ts`) validates the `access_token` JWT cookie on protected API routes under `/api/admin/*`, automatically appending authorization headers (`x-user-id`, `x-user-role`, `x-user-email`) for server handlers.

---

## 2. Server-Side Route Handlers (`src/app/api/*`)

### 2.1. Authentication Routes

#### 🔑 `POST /api/auth/login`
* **Purpose**: Authenticates admin user credentials, initializes the database, and issues cookies.
* **Payload**:
  ```json
  {
    "email": "user@intoaec.ai",
    "password": "securepassword"
  }
  ```
* **Security & Logic**:
  * Sanitizes email (trims & lowercases). Enforces `@intoaec.ai` domain.
  * Employs sliding-window rate limit (max 5 requests/min per IP).
  * Validates password via `bcrypt`.
  * Automatically upgrades plain-text legacy passwords to bcrypt hashes.
  * Signs short-lived Access Token (15m expiration) and long-lived Refresh Token (7d expiration).
  * Sets HttpOnly cookies (`access_token` and `refresh_token`).

#### 📝 `POST /api/auth/signup`
* **Purpose**: Registers a new admin user.
* **Payload**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@intoaec.ai",
    "password": "securepassword123"
  }
  ```
* **Security & Logic**:
  * Employs sliding-window rate limit (max 3 requests/10-min per IP).
  * Enforces password length restrictions (8 to 72 characters).
  * Inserts user details into PostgreSQL DB and returns initial HttpOnly token cookies.

#### 🔄 `POST /api/auth/refresh`
* **Purpose**: Rotates expired access tokens using the refresh token cookie.
* **Headers**: Accesses `refresh_token` from cookies.
* **Security & Logic**:
  * Verifies refresh token authenticity.
  * Validates JTI (JWT ID) status in Postgres.
  * **Automatic Reuse Detection**: If a revoked JTI is sent, the system invalidates *all* sessions for that user to prevent replay hijacking.
  * Performs atomic rotation (revokes old, issues new JTI) in a database transaction.

#### 🚪 `POST /api/auth/logout`
* **Purpose**: Revokes user sessions and clears cookies.
* **Action**: Revokes all active user refresh tokens in Postgres and wipes `access_token`, `refresh_token`, and `auth_session` cookies.

#### 👤 `GET /api/auth/me`
* **Purpose**: Fetches active session metadata.
* **Response**: Returns `{ authenticated: true, user: { id, name, email, role } }`.

---

### 2.2. Paymaster Subscriptions Proxy

#### 💳 `POST /api/paymaster`
* **Purpose**: Proxies requests to the Paymaster Service `/subscriptions` endpoint.
* **Downstream Target**: `${PAYMASTER_ENDPOINT}/subscriptions`
* **Sample Payload**:
  * Fetch all organizations:
    ```json
    { "eventType": "GET_ALL_IN_ONE_PLAN_ORGANIZATIONS" }
    ```
  * Fetch single organization subscription:
    ```json
    {
      "eventType": "GET_ORGANIZATION_SUBSCRIPTION_DETAILS",
      "organizationId": "org_abc123"
    }
    ```

#### 🛡️ `POST /api/paymaster-admin`
* **Purpose**: Proxies request commands to Paymaster `/admin-apis`. Protected by Edge Middleware.
* **Downstream Target**: `${PAYMASTER_ENDPOINT}/admin-apis`
* **Headers Added**: Includes `apikey` from `AECAUTOPILOT_APIKEY` environment variable.
* **Commands Sample**:
  * Extend Subscription Expiration:
    ```json
    {
      "eventType": "EXTEND_SUBSCRIPTION_DATE",
      "organizationId": "org_123",
      "expiryDate": "2026-12-31T23:59:59.999Z"
    }
    ```
  * Generate Manual Receipt:
    ```json
    {
      "eventType": "CREATE_MANUAL_RECEIPT",
      "organizationId": "org_123",
      "planName": "All in One Plan",
      "amount": 499.00,
      "currency": "USD",
      "paymentGateway": "stripe",
      "countryCode": "US",
      "taxPercentage": 8.25,
      "aecNumber": "AEC-98765"
    }
    ```
  * Coupon Creation:
    ```json
    {
      "eventType": "CREATE_DISCOUNT_COUPON",
      "couponCode": "SUMMER30",
      "discountPercentage": 30
    }
    ```

---

### 2.3. Userhub & Session Proxy

#### 🏢 `POST /api/session`
* **Purpose**: Proxies requests to Userhub sessions endpoint to verify account IDs and currencies.
* **Downstream Target**: `${USERHUB_SESSION_ENDPOINT}/session`
* **Commands Sample**:
  * Validate Organization Account:
    ```json
    {
      "eventType": "GET_ORGANIZATION_BY_ACCOUNT_ID",
      "accountNumber": "12345678"
    }
    ```
  * Detect payment configs:
    ```json
    {
      "eventType": "GET_PAYMENT_GATEWAY_DETAILS",
      "countryCode": "US"
    }
    ```

---

### 2.4. Customer Success & Analytics Proxy

#### 📈 `POST /api/customer-success`
* **Purpose**: Proxies requests to the AECAutopilot `/customer-success` analytics engine.
* **Downstream Target**: `${AECAUTOPILOT_ENDPOINT}/customer-success`
* **Headers Added**: Autopilot API Key.
* **Commands Sample**:
  * Fetch account usage breakdown:
    ```json
    {
      "eventType": "GET_ACCOUNT_DETAIL",
      "organizationId": "org_123",
      "days": 30
    }
    ```

#### 📊 `POST /api/activities`
* **Purpose**: Proxies client calls to AECAutopilot activities log engine.
* **Downstream Target**: `${AECAUTOPILOT_ENDPOINT}/activities`

#### 🚨 `POST /api/autopilot`
* **Purpose**: Proxies client requests to AECAutopilot automated alerts engine.
* **Downstream Target**: `${AECAUTOPILOT_ENDPOINT}/autopilot`

#### ⚡ `POST /api/portfolio-batch`
* **Purpose**: High-efficiency batch operations engine. Combines multiple microservice calls to generate a comprehensive CSM overview.
* **Operation Flow**:
  1. Calls `/customer-success` with `GET_PORTFOLIO_ANALYTICS` to fetch full client portfolio health stats.
  2. If the response contains no accounts, it queries Paymaster `/subscriptions` with `GET_ALL_IN_ONE_PLAN_ORGANIZATIONS` to fetch paid client list.
  3. Loops and fetches detailed usage logs via parallel `/customer-success` (`GET_ACCOUNT_DETAIL`) requests (capped at 20 concurrent queries).
  4. Dynamically aggregates data to return a structured dashboard response:
     * High-level metrics: total paid accounts, average health score, churn risk, average stickiness.
     * Health classification: healthy vs. at-risk vs. critical.
     * Daily trends: rolling health trends over a designated period.
     * Top product features usage metrics.

---

### 2.5. AI Assistant

#### 🤖 `POST /api/ai-assistant`
* **Purpose**: Handles chat prompt requests for customer success optimization recommendations.
* **Payload**:
  ```json
  {
    "prompt": "Which client account has the highest danger of canceling?",
    "contextData": { "accounts": [...] }
  }
  ```
* **Logic**: Feeds user prompts and active client details to the `generateCsInsights` backend utility, querying the `gemini-2.5-flash` model.

---

## 3. Client-Side API Callers (`src/api/*`)

These TypeScript scripts are invoked by frontend components to call the Next.js BFF routes. They reside under `src/api/`.

### 3.1. Sales & Billing Module (`src/api/sales/`)

| File Name | Signature / Input | BFF Route | Usage |
| :--- | :--- | :--- | :--- |
| `getOrganizations.ts` | `() => Promise<Organization[]>` | `/api/paymaster` | Fetches name list of all active client organizations. |
| `getSubscriptionDetails.ts`| `(orgId: string) => Promise<Subscription>` | `/api/paymaster` | Fetches active users count, renewal date, and billing parameters. |
| `extendSubscription.ts` | `(orgId: string, expiry: string) => Promise<any>`| `/api/paymaster-admin` | Extends client organization renewal date in DB. |
| `getOrganizationByAccountId.ts`| `(accountNumber: string) => Promise<Org>` | `/api/session` | Validates entered client ID and resolves the Org Name. |
| `getPaymentGatewayDetails.ts`| `(countryCode: string) => Promise<Gateway>` | `/api/session` | Resolves standard currency symbol, tax percentage, and gateway. |
| `generateReceipt.ts` | `(formData: ReceiptForm) => Promise<Receipt>` | `/api/paymaster-admin` | Requests paymaster manual receipt creation and returns URL. |
| `getCoupons.ts` | `() => Promise<Coupon[]>` | `/api/paymaster-admin` | Fetches all active promotion discount codes. |
| `createDiscount.ts` | `(couponData: CouponData) => Promise<any>` | `/api/paymaster-admin` | Generates a new percentage coupon code. |
| `deleteCoupon.ts` | `(code: string) => Promise<any>` | `/api/paymaster-admin` | Deletes a promotion discount code. |

### 3.2. Customer Success Module (`src/api/customer-success/`)

| File Name | Signature / Input | BFF Route | Usage |
| :--- | :--- | :--- | :--- |
| `getPortfolioAnalytics.ts` | `(trendDays: number) => Promise<Portfolio>`| `/api/portfolio-batch` | Fetches the consolidated CSM dashboard metrics. |
| `getAccountDetail.ts` | `(orgId: string) => Promise<AccountDetail>` | `/api/customer-success` | Fetches detailed health history and module usage breakdown. |
| `getActivities.ts` | `(params: ActivityParams) => Promise<any>` | `/api/activities` | Fetches logs of user activity logs. |
| `getAutopilotAlerts.ts` | `() => Promise<Alert[]>` | `/api/autopilot` | Fetches active autopilot triggers and client warnings. |

### 3.3. Authentication Module (`src/api/auth/`)

| File Name | Signature / Input | BFF Route | Usage |
| :--- | :--- | :--- | :--- |
| `login.ts` | `(credentials: Credentials) => Promise<any>` | `/api/auth/login` | Posts login details and initializes session cookies. |
| `logout.ts` | `() => Promise<any>` | `/api/auth/logout` | Wipes user sessions and clears browser cookies. |

---

## 4. Complete Downstream Microservice Mappings

The table below shows the complete flow of requests from the browser, through the Next.js API, and down to the actual host backends:

```text
[Browser Component]
      │
      ▼ (Calls TypeScript function in src/api/*)
[Next.js API Handler] (e.g., /api/paymaster-admin)
      │ (Appends API Key / Session info)
      ▼
[Downstream Endpoints] (e.g., Paymaster Prod URL: https://paymaster.intoaec.ai/admin-apis)
```

| Browser caller | Next.js API Route | Downstream Microservice Endpoint | Method | Required Keys / Headers |
| :--- | :--- | :--- | :--- | :--- |
| `login(...)` | `/api/auth/login` | PostgreSQL Database (Direct Query) | POST | None |
| `logout()` | `/api/auth/logout` | PostgreSQL Database (Direct Query) | POST | None |
| `getOrganizations()` | `/api/paymaster` | `https://paymaster.intoaec.ai/subscriptions` | POST | None |
| `getSubscriptionDetails(...)`| `/api/paymaster` | `https://paymaster.intoaec.ai/subscriptions` | POST | None |
| `extendSubscription(...)` | `/api/paymaster-admin`| `https://paymaster.intoaec.ai/admin-apis` | POST | `apikey` |
| `generateReceipt(...)` | `/api/paymaster-admin`| `https://paymaster.intoaec.ai/admin-apis` | POST | `apikey` |
| `createDiscount(...)` | `/api/paymaster-admin`| `https://paymaster.intoaec.ai/admin-apis` | POST | `apikey` |
| `getCoupons()` | `/api/paymaster-admin`| `https://paymaster.intoaec.ai/admin-apis` | POST | `apikey` |
| `getOrganizationByAccountId(...)`| `/api/session` | `https://userhub.intoaec.ai/session` | POST | None |
| `getPaymentGatewayDetails(...)` | `/api/session` | `https://userhub.intoaec.ai/session` | POST | None |
| `getAccountDetail(...)` | `/api/customer-success`| `https://aecautopilot.intoaec.ai/customer-success`| POST | `apikey` |
| `getActivities(...)` | `/api/activities` | `https://aecautopilot.intoaec.ai/activities` | POST | `apikey` |
| `getAutopilotAlerts()` | `/api/autopilot` | `https://aecautopilot.intoaec.ai/autopilot` | POST | `apikey` |
| `getPortfolioAnalytics(...)` | `/api/portfolio-batch`| Dynamic Orchestration (Paymaster + CS Endpoints) | POST | `apikey` |

---

*This document was compiled for the Project IA Technical Review Board. Feel free to export it as PDF or Markdown.*

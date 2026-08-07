# Prompt: Restructure My Entire React/Next.js Project Folder Structure

I have an existing React/Next.js project that has grown over time. The application contains multiple business modules such as:

- Sales
- Customer Success
- Marketing
- Founder
- Authentication
- Shared Components

Currently, the files are scattered across different folders, making the project difficult to maintain. I want you to analyze the entire project and reorganize it into a scalable, feature-based architecture without changing any existing functionality or business logic.

## Requirements

### 1. Analyze the Entire Project

Before making any changes:

- Analyze every folder and file.
- Identify all APIs.
- Identify reusable components.
- Identify module-specific components.
- Identify utility functions.
- Identify hooks.
- Identify layouts.
- Identify constants.
- Identify services.
- Identify contexts.
- Identify assets.
- Identify pages/routes.

After analysis, explain:

- Which files belong together.
- Which components should be reusable.
- Which components are module-specific.
- Which APIs belong to each module.

---

## 2. Organize by Feature (Module-Based Architecture)

Restructure the project like this:

```text
src/
│
├── app/
│
├── api/
│   ├── auth/
│   ├── sales/
│   ├── customer-success/
│   ├── marketing/
│   ├── founder/
│   ├── organization/
│   ├── subscription/
│   ├── dashboard/
│   └── common/
│
├── modules/
│
│   ├── sales/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── constants/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── customer-success/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── constants/
│   │   ├── utils/
│   │   └── index.ts
│   │
│   ├── marketing/
│   │
│   ├── founder/
│   │
│   └── auth/
│
├── components/
│   ├── common/
│   ├── layout/
│   ├── ui/
│   ├── forms/
│   ├── tables/
│   ├── cards/
│   ├── charts/
│   ├── dialogs/
│   └── navigation/
│
├── services/
│
├── hooks/
│
├── context/
│
├── lib/
│
├── utils/
│
├── constants/
│
├── types/
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── styles/
│
└── config/
```

---

## 3. API Organization

Move every API into the `api` folder.

Example:

```text
api/
    auth/
        login.ts
        logout.ts
        refreshToken.ts

    sales/
        getSalesDashboard.ts
        createDiscount.ts
        getCoupons.ts
        extendSubscription.ts

    customer-success/
        getCustomers.ts
        getCustomerDashboard.ts
        getSubscriptions.ts

    marketing/
        getCampaigns.ts

    founder/
        getOverview.ts

    organization/
        getOrganizations.ts

    common/
        axios.ts
        apiClient.ts
        endpoints.ts
```

Every API should:

- Use one Axios instance.
- Share common interceptors.
- Handle authentication tokens.
- Use common error handling.
- Export reusable API methods.

---

## 4. Component Organization

Separate reusable components from feature-specific components.

Example:

```text
components/
    common/
        Loader
        Button
        Input
        Modal
        EmptyState

    layout/
        Sidebar
        Header
        Footer
        Navbar

    charts/
        PieChart
        LineChart
        BarChart

    tables/
        DataTable

modules/
    sales/
        components/
            SalesCard
            RevenueChart
            CouponTable

    customer-success/
        components/
            CustomerCard
            SubscriptionTable
            CustomerStats
```

If a component is used in more than one module, move it to `components/common`.

---

## 5. Hooks

Move all custom hooks into:

```text
hooks/
    useAuth.ts
    usePagination.ts
    useDebounce.ts

modules/
    sales/hooks/

modules/
    customer-success/hooks/
```

---

## 6. Types

Create proper TypeScript types.

Example:

```text
types/
    api.ts
    auth.ts
    sales.ts
    customer.ts
    organization.ts
```

---

## 7. Constants

Create centralized constants.

```text
constants/
    routes.ts
    endpoints.ts
    roles.ts
    permissions.ts
    colors.ts
```

---

## 8. Utilities

Move reusable helper functions.

```text
utils/
    date.ts
    currency.ts
    formatter.ts
    validator.ts
    storage.ts
```

---

## 9. Services

Business logic should not remain inside components.

Create:

```text
services/
    authService.ts
    salesService.ts
    customerService.ts
    organizationService.ts
```

Components should only call service methods.

---

## 10. Context

Move all providers into:

```text
context/
    AuthContext.tsx
    ThemeContext.tsx
    SidebarContext.tsx
```

---

## 11. Configuration

Move configuration files into:

```text
config/
    axios.ts
    env.ts
    routes.ts
```

---

## 12. Imports

After restructuring:

- Update every import path.
- Remove unused imports.
- Remove duplicate files.
- Remove dead code.
- Remove duplicate API calls.

---

## 13. Keep Functionality Intact


Important:

- Do NOT change business logic.
- Do NOT modify API request/response formats.
- Do NOT change UI behavior.
- Do NOT break routing.
- Do NOT remove any existing features.

Only improve the project structure.

---


# Sales Dashboard — Organization Subscription Update Integration

Analyze the existing Sales Dashboard implementation and documentation before making any changes.

The existing Sales Dashboard is located at:

`src/modules/sales/pages/SalesDashboardPage.tsx`

The Sales module already supports organization selection, fetching the organization's active subscription, resolving the subscription plan name, and extending the subscription validity. Preserve the existing functionality and enhance it instead of creating a separate workflow.

The existing documentation states that organization selection loads verified organizations, selecting an organization retrieves its active subscription, and subscription extension is already supported.

## New Backend API

We now have the following Paymaster API for updating an organization's subscription:

### HTTP Method

`POST`

### Backend Endpoint

`http://localhost:9097/admin-apis`

### Event Type

`UPDATE_ORGANIZATION_SUBSCRIPTION`

### Request

```json
{
  "eventType": "UPDATE_ORGANIZATION_SUBSCRIPTION",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "planId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "planName": "Professional",
  "validFrom": 1755000000000,
  "validTill": 1760000000000,
  "licenseCount": 50,
  "paymentTenure": "QUARTERLY",
  "recurringAutoDebit": false
}
```

Do not hardcode any of these values.

The values must come dynamically from the Sales Dashboard UI and the currently selected organization.

---

# 1. Analyze Existing Implementation First

Before modifying the code, inspect:

- `SalesDashboardPage.tsx`
- Existing `salesService.ts`
- Existing API routes
- Existing Paymaster proxy/API route
- Existing organization API
- Existing subscription API
- Existing subscription-plan API
- Existing TypeScript interfaces/types
- Existing UI components
- Existing date-picker implementation
- Existing notification/toast implementation
- Existing loading states
- Existing error handling

Follow the existing project architecture and coding conventions.

Do not create duplicate APIs or duplicate service functions if equivalent functionality already exists.

Do not modify unrelated modules.

---

# 2. Sales Dashboard UI Changes

Update the Sales Dashboard subscription section.

After selecting an organization, fetch and display its current subscription details.

The UI should contain the following fields:

### Organization

Keep the existing organization/company dropdown.

When an organization is selected, retrieve its current subscription.

---

### Organization Plan

Replace the current read-only plan-name display with an editable plan dropdown.

The dropdown should display the available subscription plans.

Example:

```text
Organization Plan
┌─────────────────────────────┐
│ Professional            ▼   │
└─────────────────────────────┘
```

The current organization's plan must be selected automatically when the organization is loaded.

The dropdown value should use the plan ID internally.

For example:

```text
Display:
Professional

Internal value:
3fa85f64-5717-4562-b3fc-2c963f66afa6
```

When the admin selects another plan:

- Update the selected `planId`
- Update the corresponding `planName`
- Keep both values synchronized
- Use the selected plan information when constructing the update API payload

The existing documentation indicates that the current subscription contains `subscriptionPlanId` and that plan metadata is resolved using `GET_SUBSCRIPTION_PLAN_BY_ID`. Reuse the existing plan-resolution/catalog logic where appropriate.

---

# 3. Allocated License Field

Add an editable field for the organization's allocated licenses.

Example:

```text
Allocated Licenses
┌─────────────────────────────┐
│ 50                          │
└─────────────────────────────┘
```

When the organization is selected:

- Populate the field with the current `licenseCount`
- Allow the admin to modify it
- Only allow valid positive numeric values
- Do not allow the value to be lower than the organization's currently used licenses if `licenseCountUsed` is available

Example:

```text
Current allocated: 50
Current used: 20

Admin enters: 75
→ Valid

Admin enters: 10
→ Invalid
```

Display a clear validation message when the allocated license count is less than the number of licenses already used.

Do not silently modify the value.

---

# 4. Subscription Date Extension

Keep the existing subscription date extension functionality.

The UI should allow the admin to select a new `validTill` date.

The new date must be later than the current subscription expiry date.

Example:

```text
Current expiry:
31-Aug-2026

New expiry:
30-Nov-2026
```

The selected date must be converted into the format expected by the backend:

```text
Unix timestamp in milliseconds
```

For example:

```javascript
new Date(selectedDate).getTime()
```

Do not change the existing date handling unnecessarily. Reuse the current date-picker and date utilities if they already exist.

---

# 5. Valid From Date

When loading the organization subscription, populate `validFrom` from the current subscription.

Unless the existing business logic explicitly allows changing the start date, keep `validFrom` unchanged when the admin only extends the subscription.

The API request should therefore normally use the existing subscription's `validFrom`.

---

# 6. Payment Tenure

Use the existing subscription's payment tenure when updating the subscription.

If the Sales Dashboard already has a payment-tenure selector, reuse it.

If it does not have one, do not add a new UI field unless it is required by the existing business requirements.

The API should receive the current value, for example:

```text
MONTHLY
QUARTERLY
HALF_YEARLY
ANNUAL
```

---

# 7. Recurring Auto Debit

Preserve the organization's existing recurring auto-debit setting.

Send it in the update request:

```json
"recurringAutoDebit": false
```

Do not change this value just because the plan or license count changes.

---

# 8. Update Button

Add or update the existing subscription action button.

For example:

```text
┌─────────────────────────────────────┐
│        Update Subscription          │
└─────────────────────────────────────┘
```

The button should become enabled only when:

- An organization is selected
- A valid plan is selected
- Allocated license count is valid
- New subscription date is valid
- Required subscription information has been loaded

If there are no changes, optionally disable the button or show an appropriate message.

---

# 9. API Integration

Create a new service method in the existing `salesService` or equivalent service layer.

Use the existing project API architecture.

Do not call:

```text
http://localhost:9097/admin-apis
```

directly from the browser if the existing architecture proxies Paymaster requests through the Next.js API layer.

The existing documentation specifies that the Sales UI communicates through the Next.js API router and `salesService`, with Paymaster behind that proxy.

Therefore follow the existing pattern:

```text
SalesDashboardPage
        ↓
salesService
        ↓
Next.js API route
        ↓
Paymaster
        ↓
POST /admin-apis
```

Use the existing Paymaster proxy mechanism instead of introducing a new direct browser-to-Paymaster connection.

---

# 10. API Request Construction

When the admin clicks "Update Subscription", construct:

```json
{
  "eventType": "UPDATE_ORGANIZATION_SUBSCRIPTION",
  "organizationId": "<selected organization ID>",
  "planId": "<selected plan ID>",
  "planName": "<selected plan name>",
  "validFrom": "<current validFrom>",
  "validTill": "<selected new expiry date in milliseconds>",
  "licenseCount": "<entered allocated license count>",
  "paymentTenure": "<current payment tenure>",
  "recurringAutoDebit": "<current recurring auto debit value>"
}
```

All values must be dynamic.

Do not hardcode:

- organizationId
- planId
- planName
- dates
- licenseCount
- paymentTenure
- recurringAutoDebit

---

# 11. Important Plan Synchronization

Make sure the plan dropdown does not send only the plan name.

The backend requires both:

```text
planId
planName
```

Therefore, when a plan is selected:

```text
Selected option
      ↓
planId
planName
      ↓
API payload
```

Example:

```json
{
  "planId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "planName": "Professional"
}
```

Do not derive the plan ID from the plan name manually.

Use the actual plan object returned by the existing plan API/catalog.

---

# 12. Loading State

When the update API is being called:

- Disable the Update Subscription button
- Prevent duplicate submissions
- Show the existing project loading indicator/spinner
- Keep the form state intact

After success:

- Stop loading
- Show the existing success notification/toast
- Refresh the organization's subscription details
- Update the UI with the values returned by the backend

---

# 13. Error Handling

Handle API failures properly.

At minimum handle:

### Organization not found

Show an appropriate error.

### Invalid plan

Show:

```text
Selected subscription plan is invalid.
```

### Invalid license count

Show:

```text
Allocated licenses cannot be lower than the licenses already in use.
```

### Invalid subscription date

Show:

```text
Subscription expiry date must be later than the current expiry date.
```

### API/network failure

Show a meaningful error using the project's existing error notification mechanism.

Do not expose raw backend errors directly to the user unless that is already the project's convention.

---

# 14. Refresh Subscription After Update

After a successful update:

```text
Update API
    ↓
Success
    ↓
GET_ORGANIZATION_SUBSCRIPTION_DETAILS
    ↓
Refresh UI
```

The refreshed data should populate:

- Current plan
- Allocated licenses
- Used licenses
- Valid from
- Valid till
- Payment tenure
- Recurring auto debit

Do not rely only on the form's local state after the update.

Fetch the updated subscription from the backend so that the UI reflects the actual database state.

---

# 15. Preserve Existing Functionality

Do not break the existing Sales Dashboard functionality.

The existing dashboard already supports:

- Organization selection
- Organization subscription retrieval
- Plan name resolution
- Subscription extension

Preserve these workflows while enhancing the subscription management functionality.

Do not modify the Receipt Generator functionality.

Do not modify unrelated Sales Dashboard features.

---

# 16. Expected Final UI

The subscription section should approximately contain:

```text
Organization
┌─────────────────────────────────────┐
│ Acme Corporation                ▼   │
└─────────────────────────────────────┘


Organization Plan
┌─────────────────────────────────────┐
│ Professional                    ▼   │
└─────────────────────────────────────┘


Allocated Licenses
┌─────────────────────────────────────┐
│ 50                                  │
└─────────────────────────────────────┘

Licenses Used
20
(read-only)


Current Subscription Expiry
31-Aug-2026
(read-only)


Extend Subscription Until
┌─────────────────────────────────────┐
│ 30-Nov-2026                      📅 │
└─────────────────────────────────────┘


Payment Tenure
QUARTERLY
(read-only unless already editable)


Recurring Auto Debit
Disabled
(read-only unless already editable)


             [ Update Subscription ]
```

The exact UI styling should follow the existing Sales Dashboard design system and components.

Do not redesign the entire page.

---

# 17. Testing

Test the following scenarios.

### Scenario 1 — Change Plan

Current:

```text
Plan: Basic
Licenses: 20
Expiry: 31-Aug-2026
```

Change:

```text
Plan: Professional
```

Expected:

```text
Plan = Professional
Licenses = 20
Expiry = unchanged
```

### Scenario 2 — Increase Licenses

Current:

```text
Plan: Professional
Allocated: 20
Used: 15
```

Change:

```text
Allocated: 50
```

Expected:

```text
Allocated = 50
Used = 15
```

### Scenario 3 — Change Plan + Licenses + Expiry

Current:

```text
Plan: Basic
Allocated: 20
Expiry: 31-Aug-2026
```

Change to:

```text
Plan: Professional
Allocated: 50
Expiry: 30-Nov-2026
```

Expected API payload:

```json
{
  "eventType": "UPDATE_ORGANIZATION_SUBSCRIPTION",
  "organizationId": "<organization ID>",
  "planId": "<Professional plan ID>",
  "planName": "Professional",
  "validFrom": "<existing validFrom>",
  "validTill": "<30-Nov-2026 timestamp>",
  "licenseCount": 50,
  "paymentTenure": "<existing tenure>",
  "recurringAutoDebit": "<existing value>"
}
```

### Scenario 4 — Invalid License Count

If:

```text
Used licenses = 30
```

and admin enters:

```text
Allocated licenses = 20
```

the API must not be called.

Display a validation error.

### Scenario 5 — Invalid Expiry

If the current expiry is:

```text
31-Aug-2026
```

and the admin selects:

```text
20-Aug-2026
```

do not allow submission.

### Scenario 6 — API Failure

Simulate an API failure and verify:

- Loading stops
- Error notification appears
- Existing form values remain
- No false success message is shown

---

# 18. Final Deliverable

After making the changes, provide a summary containing:

1. Files inspected
2. Files created
3. Files modified
4. New service method
5. API route used by the frontend
6. Paymaster API integration
7. UI changes
8. Request payload
9. Validation rules
10. Success flow
11. Error handling
12. How to test the complete flow in Postman/browser

Before finishing, verify that the implementation follows the existing Sales Dashboard architecture and does not duplicate existing functionality.
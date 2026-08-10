## Prompt: Complete Organization → Receipt → Receipt URL Flow

I want to implement the complete manual receipt generation flow in my existing frontend application.

Before making changes, analyze the existing project structure and follow the existing API/service/component architecture. Do not create duplicate API utilities or unnecessarily modify unrelated code.

### STEP 1 — Fetch Organization

Use the existing organization API:

```text
POST http://localhost:9091/session  
```

Request:

```json
{
  "eventType": "GET_ORGANIZATION_BY_ACCOUNT_ID",
  "accountId": "AEC-2002"
}
```

The purpose of this API is to fetch the organization information and obtain the `organizationId`.

Do not hardcode the organization UUID returned from the API.

The account ID may remain configurable/dynamic according to the existing application structure.

Display the organizations using the existing organization/company dropdown if one already exists.

When the user selects an organization, store its `organizationId`.

Example:

```javascript
const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
```

---

### STEP 2 — Create Manual Receipt

After the user selects an organization and fills in the receipt form, call:

```text
POST http://localhost:9097/admin-apis
```

Request:

```json
{
  "eventType": "CREATE_MANUAL_RECEIPT",
  "organizationId": "<SELECTED_ORGANIZATION_ID>",
  "paidOn": "<PAID_ON>",
  "amountPaid": "<AMOUNT_PAID>",
  "duration": "<DURATION>",
  "numUsers": "<NUM_USERS>",
  "country": "<COUNTRY>",
  "planName": "<PLAN_NAME>",
  "aecNumber": "<AEC_NUMBER>"
}
```

Important:

Do NOT hardcode:

```text
c98594d1-ab26-461f-a084-c0b95d14ecf5
```

Instead use the organization ID selected from Step 1:

```javascript
organizationId: selectedOrganizationId
```

The other receipt fields should come from the existing receipt form.

---

### STEP 3 — Handle the Receipt API Response

The successful response from the API has this structure:

```json
{
  "code": "MANUAL_RECEIPT_CREATED",
  "message": "Manual subscription receipt created successfully.",
  "body": {
    "sphId": "42287281-b117-4294-875f-a0e532fe6e1a",
    "receiptId": "INV-116520",
    "organizationId": "c98594d1-ab26-461f-a084-c0b95d14ecf5",
    "paymentGatewayReferenceId": "MANUAL-REF-AEC-1983-WF61HG",
    "paymentTransactionStatus": "SUCCESS",
    "paidAt": 1744365054000,
    "amount": 305946,
    "frequency": 12,
    "recurringDiscount": 0.54,
    "couponCode": "MANUAL-RECURRING-AEC-1983-WF61HG",
    "paidOn": "11-04-2025 15:20:54",
    "paidAtEpochMs": 1744365054000,
    "amountMajor": 3059.46,
    "currency": "MYR",
    "standardNet": 3060,
    "taxAmount": 0,
    "taxPercentage": 0,
    "billingPeriodDiscount": 540,
    "lineItems": []
  }
}
```

The receipt ID must be extracted from:

```javascript
response.body.receiptId
```

For example:

```javascript
const receiptId = response.body.receiptId;
```

Do not use `sphId` as the receipt ID.

---

### STEP 4 — Generate the Receipt URL

After successfully creating the receipt, construct the receipt URL using the returned `receiptId`.

Base URL:

```text
https://app.aecplayhouse.com/subscription/receipt
```

Add the query parameter:

```text
receiptId
```

Example:

```javascript
const receiptUrl =
  `https://app.aecplayhouse.com/subscription/receipt?receiptId=${receiptId}`;
```

If the API returns:

```text
INV-116520
```

the final URL should be:

```text
https://app.aecplayhouse.com/subscription/receipt?receiptId=INV-116520
```

---

### STEP 5 — Open the Receipt

After successful receipt creation and after obtaining a valid `receiptId`, open the receipt URL in a new browser tab:

```javascript
window.open(receiptUrl, "_blank");
```

Do not open the receipt URL if receipt creation fails or if `receiptId` is missing.

---

### Complete Expected Flow

The final implementation should work like this:

```text
                    FRONTEND
                       |
                       v
          Fetch Organization API
                       |
                       v
             Select Organization
                       |
                       v
              organizationId
                       |
                       v
              Receipt Form
                       |
                       v
          Create Manual Receipt API
                       |
                       v
            Successful Response
                       |
                       v
       response.body.receiptId
                       |
                       v
              Build Receipt URL
                       |
                       v
              Open New Tab
                       |
                       v
https://app.aecplayhouse.com/subscription/receipt
                 ?receiptId=INV-116520
```

### Validation Requirements

Before calling the receipt API, validate:

- An organization is selected.
- `selectedOrganizationId` exists.
- `paidOn` is provided.
- `amountPaid` is valid.
- `duration` is selected.
- `numUsers` is valid.
- `country` is provided.
- `planName` is selected.
- `aecNumber` is provided.

If `selectedOrganizationId` is missing, do not call the receipt API.

### Receipt API Loading State

While the receipt is being generated:

- Disable the Generate Receipt button.
- Show an appropriate loading indicator.
- Prevent duplicate API submissions.

After completion:

- Re-enable the button.
- Handle success and errors appropriately.

### Error Handling

Handle:

1. Organization API failure.
2. Empty organization response.
3. Organization selection missing.
4. Receipt API failure.
5. Network failure.
6. Missing `response.body.receiptId`.
7. Invalid receipt API response.

Do not open the receipt URL if receipt creation was unsuccessful.

### Important Project Rules

Before implementation:

1. Analyze the existing project.
2. Reuse the existing API/service architecture.
3. Reuse the existing organization dropdown.
4. Reuse the existing receipt form if available.
5. Follow the existing Axios/Fetch pattern.
6. Follow the existing error-handling pattern.
7. Do not hardcode the organization UUID.
8. Do not hardcode the generated receipt ID.
9. Do not change the backend API contracts.
10. Do not modify unrelated functionality.

The final implementation should connect the existing organization selection, receipt form, receipt creation API, and receipt URL into one complete flow.
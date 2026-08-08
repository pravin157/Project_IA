## Prompt: Integrate Receipt Generation API

I now want to integrate the second API into my existing frontend application.

The first API is responsible for fetching the organization information and obtaining the `organizationId`.

### Second API Details

**Endpoint:**

`POST http://localhost:9097/admin-apis`

**Request Body:**

```json
{
  "eventType": "CREATE_MANUAL_RECEIPT",
  "organizationId": "c98594d1-ab26-461f-a084-c0b95d14ecf5",
  "paidOn": "11-04-2025 15:20:54",
  "amountPaid": 3059.46,
  "duration": "ANNUAL",
  "numUsers": 1,
  "country": "MY",
  "planName": "ALL_IN_ONE_PLAN",
  "aecNumber": "AEC-1983"
}
```

### Important Dependency

The `organizationId` must NOT be hardcoded.

It must come from the organization selected/fetched using the first API:

```text
POST http://localhost:9091/session
```

with:

```json
{
  "eventType": "GET_ORGANIZATION_BY_ACCOUNT_ID",
  "accountId": "AEC-2002"
}
```

The organization returned from API 1 should provide the `organizationId`.

That `organizationId` must then be passed to the second API.

### Required Flow

Implement the following frontend flow:

```text
1. Fetch organizations using API 1
        ↓
2. Display organizations in the existing organization dropdown/UI
        ↓
3. User selects an organization
        ↓
4. Store the selected organizationId
        ↓
5. User fills/submits the receipt form
        ↓
6. Call CREATE_MANUAL_RECEIPT API
        ↓
7. Pass the selected organizationId
        ↓
8. Display the receipt-generation response
```

### Receipt API Function

Create or update the appropriate API/service file according to the existing project structure.

Create a function similar to:

```javascript
createManualReceipt(receiptData)
```

It should send:

```http
POST http://localhost:9097/admin-apis
```

with:

```javascript
{
  eventType: "CREATE_MANUAL_RECEIPT",
  organizationId: receiptData.organizationId,
  paidOn: receiptData.paidOn,
  amountPaid: receiptData.amountPaid,
  duration: receiptData.duration,
  numUsers: receiptData.numUsers,
  country: receiptData.country,
  planName: receiptData.planName,
  aecNumber: receiptData.aecNumber
}
```

### Important: Do Not Hardcode organizationId

Do NOT do this:

```javascript
organizationId: "c98594d1-ab26-461f-a084-c0b95d14ecf5"
```

Instead:

```javascript
organizationId: selectedOrganizationId
```

where `selectedOrganizationId` comes from the organization selected by the user.

### Form Fields

The receipt form should collect the following values:

- `paidOn`
- `amountPaid`
- `duration`
- `numUsers`
- `country`
- `planName`
- `aecNumber`

The `organizationId` should come from the selected organization and should not be manually entered by the user.

### Example Frontend State

Use the existing state-management pattern in the project. If appropriate:

```javascript
const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
```

Then when the organization is selected:

```javascript
setSelectedOrganizationId(selectedOrganizationId);
```

When submitting the receipt:

```javascript
const receiptData = {
  eventType: "CREATE_MANUAL_RECEIPT",
  organizationId: selectedOrganizationId,
  paidOn,
  amountPaid,
  duration,
  numUsers,
  country,
  planName,
  aecNumber
};

await createManualReceipt(receiptData);
```

### Validation

Before calling the receipt API, validate:

- Organization is selected
- `organizationId` exists
- `paidOn` is provided
- `amountPaid` is valid
- `duration` is selected
- `numUsers` is valid
- `country` is selected/provided
- `planName` is selected
- `aecNumber` is provided

If `organizationId` is missing, do not call the receipt API.

Show an appropriate error message to the user.

### Error Handling

Handle:

- Loading state while generating the receipt
- Successful receipt creation
- API errors
- Network errors
- Validation errors
- Empty/invalid API responses

Prevent duplicate receipt creation while the API request is in progress.

### Project Structure

Before making changes:

1. Analyze the existing frontend project.
2. Find the existing API/service structure.
3. Find the existing sales/receipt component.
4. Follow the project's existing Axios/Fetch pattern.
5. Reuse existing form components and UI wherever possible.
6. Do not create duplicate API utilities if an existing API utility can be reused.
7. Do not modify unrelated functionality.

### Do Not Change API Contracts

Use the exact:

**Endpoint:**

```text
http://localhost:9097/admin-apis
```

**eventType:**

```text
CREATE_MANUAL_RECEIPT
```

Do not rename the request fields.

### Final Expected Architecture

```text
                    FRONTEND
                       │
                       │ accountId
                       ▼
              ┌─────────────────┐
              │     API 1       │
              │ localhost:9091  │
              │    /session     │
              └────────┬────────┘
                       │
                       │ organizationId
                       ▼
              ┌─────────────────┐
              │ Organization UI │
              │ / Dropdown      │
              └────────┬────────┘
                       │
                       │ selectedOrganizationId
                       ▼
              ┌─────────────────┐
              │ Receipt Form    │
              │                 │
              │ paidOn          │
              │ amountPaid      │
              │ duration        │
              │ numUsers        │
              │ country         │
              │ planName        │
              │ aecNumber       │
              └────────┬────────┘
                       │
                       │ organizationId + form data
                       ▼
              ┌─────────────────┐
              │     API 2       │
              │ localhost:9097  │
              │ /admin-apis     │
              └────────┬────────┘
                       │
                       ▼
              CREATE_MANUAL_RECEIPT
                       │
                       ▼
                Receipt Response
```

### Important

Do not change or remove the existing API 1 implementation.

Do not hardcode the organization ID.

Do not implement any additional APIs.

Only integrate the `CREATE_MANUAL_RECEIPT` API and connect its `organizationId` to the organization selected through API 1.
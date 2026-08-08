## Prompt: Integrate Organization API

I want to integrate the following API into my existing frontend application.

### API Details

**Endpoint:**
`POST http://localhost:9091/session`

**Request Body:**
```json
{
  "eventType": "GET_ORGANIZATION_BY_ACCOUNT_ID",
  "accountId": "AEC-2002"
}
```

### Requirements

1. **First analyze the existing frontend project structure** before making any changes.
   - Identify the existing API/service folder.
   - Identify where API calls are currently implemented.
   - Identify the relevant Sales/Organization component or page where this API should be integrated.
   - Follow the existing project architecture and coding conventions.
   - Do not unnecessarily create duplicate folders or files.

2. Create or update the appropriate API/service file for the organization API.

3. Implement a function similar to:

```javascript
getOrganizationByAccountId(accountId)
```

This function should:
- Send a `POST` request to:
  `http://localhost:9091/session`
- Send the following request body:

```json
{
  "eventType": "GET_ORGANIZATION_BY_ACCOUNT_ID",
  "accountId": accountId
}
```

4. Do **not hardcode `AEC-2002` inside the API function**.

The function should accept the account ID dynamically:

```javascript
getOrganizationByAccountId("AEC-2002")
```

5. Integrate this API into the appropriate frontend component.

6. For the first implementation, only focus on **fetching the organization data**.

Do NOT implement the receipt-generation API yet.

7. Store the API response in the appropriate React state.

For example:

```javascript
const [organizations, setOrganizations] = useState([]);
```

Use the actual response structure returned by the API rather than assuming a response format.

8. Display the fetched organization information in the existing UI.

If the existing UI already contains an organization/company dropdown, integrate the API into that dropdown instead of creating another dropdown.

9. Handle:
- Loading state
- API success
- API failure
- Empty response
- Network errors

10. Add appropriate error handling without breaking the existing application.

11. Do not modify unrelated components, APIs, authentication, routing, or styling.

12. Do not implement the second receipt API at this stage.

### Important

Before coding, inspect the existing project and determine:

- Where API calls belong
- Which component should call this API
- How existing API calls handle errors
- How environment/base URLs are currently configured
- Whether Axios or Fetch is already being used

Follow the existing pattern instead of introducing a new approach.

### Expected Flow

```text
Frontend Component
       ↓
getOrganizationByAccountId(accountId)
       ↓
POST http://localhost:9091/session
       ↓
{
  eventType: "GET_ORGANIZATION_BY_ACCOUNT_ID",
  accountId: "AEC-2002"
}
       ↓
API Response
       ↓
Store organization data in React state
       ↓
Display organizations in the existing UI
```

### Testing

After implementation, verify that:

1. The frontend successfully calls the API.
2. The request method is `POST`.
3. The request body contains the correct `eventType`.
4. The correct `accountId` is sent.
5. The API response is received and stored.
6. The organization data is displayed correctly.
7. Errors are handled properly.

Do not proceed with receipt generation. Complete and verify only this organization API integration.
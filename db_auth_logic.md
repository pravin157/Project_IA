# Database Authentication Logic Documentation

This document describes the database schema, connection handling, and SQL queries used to manage user authentication in the system.

---

## 1. Database Schema
The authentication system utilizes a single `users` table. The table schema definition is as follows:

```sql
CREATE TABLE IF NOT EXISTS users (
  -- Unique auto-incrementing identifier
  id SERIAL PRIMARY KEY,
  
  -- User's display name
  name VARCHAR(255) NOT NULL,
  
  -- Unique email address (enforces uniqueness at the database level)
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- Plain text password (currently stored as plain text per requirements)
  password VARCHAR(255) NOT NULL,
  
  -- Timestamp of account creation (defaults to current time with timezone)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Connection Pool & Host Sanitization

The system maintains a pool of client connections to minimize connection overhead. The pool connects using either a single `DATABASE_URL` string or separate parameters from `.env.local`.

If the `DB_HOST` starts with a JDBC connection prefix (e.g. `jdbc:postgresql://`), the hostname string is automatically sanitized:

```typescript
// Location: utils/db.ts
function getCleanHost(host: string | undefined): string {
  if (!host) return 'localhost';
  // 1. Remove "jdbc:postgresql://" or "postgresql://" protocol
  let clean = host.replace(/^(jdbc:)?postgresql:\/\//i, '');
  // 2. Extract only the IP or domain name (removes port and database suffix if present)
  clean = clean.split('/')[0].split(':')[0];
  return clean;
}
```

---

## 3. Database Logic & Query Walkthrough

### A. Automatic Table Initialization
Whenever a login or signup request is made, the application calls `initDb()`. This runs a query to ensure the `users` table exists. It utilizes a state variable `dbInitialized` to ensure this query is executed exactly once during the application's lifecycle.

* **SQL Executed**:
  ```sql
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  ```

---

### B. User Registration Logic (Signup)
The registration sequence queries the database to ensure the email is unique, and then inserts the new record.

#### 1. Check for Duplicate Emails
* **Purpose**: Prevents duplicate account creation and database errors.
* **SQL Query**:
  ```sql
  SELECT id FROM users WHERE email = $1;
  ```
* **Parameters**: `[$1 = email.toLowerCase()]`
* **Logic**: If the result contains any rows (`rows.length > 0`), the signup fails and returns a `400 Bad Request` explaining the user already exists.

#### 2. Insert New User
* **Purpose**: Saves the user's details.
* **SQL Query**:
  ```sql
  INSERT INTO users (name, email, password) VALUES ($1, $2, $3);
  ```
* **Parameters**: `[$1 = name, $2 = email.toLowerCase(), $3 = password]`
* **Logic**: On successful execution, it commits the row and returns a success response.

---

### C. User Verification Logic (Login)
The login sequence searches for the user by email, and compares the entered password with the value retrieved from the database.

#### 1. Fetch User Record
* **Purpose**: Retrieve the user's name and password.
* **SQL Query**:
  ```sql
  SELECT name, password FROM users WHERE email = $1;
  ```
* **Parameters**: `[$1 = email.toLowerCase()]`
* **Logic**:
  - If no rows match, the API returns a `401 Unauthorized`.
  - If a row matches, it compares the entered password with `user.password`. If they match, a success response is returned.

---

## 4. Summary of Code Paths

```
[Signup API Call]
    └── initDb()
         └── client.query("CREATE TABLE IF NOT EXISTS users...")
    └── client.query("SELECT id FROM users WHERE email = $1")
    └── (If count == 0) -> client.query("INSERT INTO users VALUES ($1, $2, $3)")

[Login API Call]
    └── initDb()
    └── client.query("SELECT name, password FROM users WHERE email = $1")
    └── (If row exists) -> Compare passwords -> Success/Failure
```

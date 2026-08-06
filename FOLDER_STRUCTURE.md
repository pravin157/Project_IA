# Project structure and coding standards

This project uses the Next.js App Router. The `app` directory is reserved for
pages, layouts, and route handlers because those file names define public URLs.
Application logic is kept outside of it.

```text
app/                         # Routes and Next.js UI entry points
  api/                       # HTTP route handlers exposed as /api/*
  dashboard/                 # Dashboard pages and layouts
  login/ and signup/         # Authentication pages
client/                      # Browser-only code
  api/                       # Typed clients that call /api/* endpoints
  auth/                      # Browser authentication actions
components/                  # Reusable React UI components
server/                      # Server-only business and infrastructure code
  ai/                        # Gemini integration
  auth/                      # Tokens and password hashing
  database/                  # PostgreSQL pool and schema bootstrap
  security/                  # Rate limiting and related safeguards
shared/                      # Code safe to use from client and server
  customer-success/          # Formatting and display helpers
  types/                     # Shared TypeScript domain/API types
public/                      # Static assets
proxy.ts                     # Next.js request proxy
```

## Dependency direction

```text
components / app pages  ->  client / shared
app/api route handlers  ->  server / shared
server                  ->  shared
```

`client` must not import `server`; doing so could expose secrets or Node-only
dependencies in browser bundles. Route handlers should stay thin: validate the
request, call `server` code, and return an HTTP response.

## Coding standards

- Use TypeScript for new application code; keep `strict` TypeScript enabled.
- Use the `@/` import alias for imports across top-level folders.
- Keep React components focused on rendering and user interaction. Put remote
  requests in `client/api` and reusable formatting/types in `shared`.
- Put database access, secrets, JWT logic, AI integrations, and security
  controls only in `server`.
- Name route handlers `route.ts`; do not move them outside `app/api`, because
  Next.js would no longer expose the endpoint.
- Prefer named exports, explicit input/output types at module boundaries, and
  `unknown` in error handling rather than `any`.
- Run `npm.cmd run lint` and `npx.cmd tsc --noEmit` before merging changes.

## Current improvement opportunities

- The in-memory limiter in `server/security/rate-limit.ts` is per process. Use
  a shared store such as Redis before horizontally scaling production traffic.
- `server/database/pool.ts` creates and alters tables at runtime. Move these
  statements into versioned migrations for predictable deployments.
- Add route-handler tests for authentication, token rotation, and rate limits.

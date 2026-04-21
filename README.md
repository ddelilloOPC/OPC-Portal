# OPC Portal

A secure internal portal for managing and sharing links across your organisation.
Users authenticate via Microsoft (no passwords), admins manage links from a dedicated panel.
There is no database — portal data lives in a single JSON blob on Azure Storage.

---

## Table of contents

- [Architecture](#architecture)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend setup](#backend-setup)
  - [Frontend setup](#frontend-setup)
- [Environment variables](#environment-variables)
- [Microsoft Entra ID setup](#microsoft-entra-id-setup)
- [Authentication flow](#authentication-flow)
- [Admin access](#admin-access)
- [API reference](#api-reference)
- [Production build](#production-build)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
 Browser
    |
    |  /auth/*  ->  Flask OAuth flow
    |  /api/*   ->  Flask REST API
    |  /*       ->  React SPA (served by Flask in prod)
    |
    v
 Flask (port 5000)
    |
    +-- /auth/login      redirect to Microsoft
    +-- /auth/callback   exchange code, store server-side session
    +-- /api/me          return current user from session
    +-- /api/links       CRUD (admin-gated writes)
    |
 Azure Blob Storage
   container: portal-data
   blob:      links.json
```

**Key design decisions:**

- **No tokens in the browser.** The OAuth flow is entirely server-side. The client only sees a signed session cookie.
- **No database.** All portal data is stored as a single JSON blob, which is sufficient for a list of links.
- **Single deploy unit in production.** `npm run build` places the React bundle inside `backend/app/static/dist/`. Flask serves everything: API, auth, and the SPA.

---

## Getting started

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Python | 3.11 |
| Node.js | 20 |
| Azure Storage | account or [Azurite](#local-blob-emulation) for local dev |
| Microsoft Entra ID | App Registration ([setup guide below](#microsoft-entra-id-setup)) |

---

### Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values — see Environment variables below

# Start the development server
python run.py
# -> http://localhost:5000
```

To use uvicorn (ASGI) instead of the Flask dev server:

```bash
uvicorn run:app --reload --port 5000
```

> Both commands work for development. Prefer uvicorn for production.

---

### Frontend setup

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
# -> http://localhost:5173
```

Vite proxies `/api` and `/auth` to Flask on `:5000` automatically.
Open `http://localhost:5173` in your browser during development.

---

## Environment variables

All variables live in `backend/.env`. Copy `backend/.env.example` to get started.

### Required

| Variable | Description |
|----------|-------------|
| `MICROSOFT_CLIENT_ID` | Application (client) ID from your Entra ID app registration |
| `MICROSOFT_TENANT_ID` | Directory (tenant) ID from your Entra ID app registration |
| `MICROSOFT_CLIENT_SECRET` | Client secret value (not the secret ID) |
| `AZURE_STORAGE_CONNECTION_STRING` | Full connection string for your Azure Storage account |
| `SECRET_KEY` | Random secret used to sign Flask session cookies |

Generate a secure `SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_EMAILS` | *(empty)* | Comma-separated list of admin email addresses |
| `AZURE_STORAGE_CONTAINER` | `portal-data` | Blob container name |
| `AZURE_STORAGE_BLOB_NAME` | `links.json` | Blob file name |
| `REDIRECT_URI` | `http://localhost:5000/auth/callback` | OAuth callback URI — must match Entra ID registration |

### Local blob emulation

To develop without a real Azure Storage account, use [Azurite](https://github.com/Azure/Azurite):

```bash
npm install -g azurite
azurite --silent --location .azurite
```

Then add to `backend/.env`:

```env
AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true
```

---

## Microsoft Entra ID setup

1. Open **Azure Portal -> Microsoft Entra ID -> App registrations -> New registration**
2. Set **Name** to `OPC Portal`, **Supported account types** to *Single tenant*
3. Skip the redirect URI for now and click **Register**
4. From the app overview, copy the two IDs you need:
   - **Application (client) ID** -> `MICROSOFT_CLIENT_ID`
   - **Directory (tenant) ID** -> `MICROSOFT_TENANT_ID`
5. Go to **Certificates & secrets -> New client secret**, set an expiry, and copy the **Value** -> `MICROSOFT_CLIENT_SECRET`
6. Go to **Authentication -> Add a platform -> Web** and add the redirect URI:

   | Environment | URI |
   |-------------|-----|
   | Local development | `http://localhost:5000/auth/callback` |
   | Production | `https://your-domain.com/auth/callback` |

7. Under **Implicit grant and hybrid flows**, enable **ID tokens**
8. Click **Save**

---

## Authentication flow

The authentication flow is entirely backend-driven. The browser never handles a token.

```
User                 Flask                  Microsoft Entra ID
 |                     |                           |
 |-- GET /auth/login ->|                           |
 |                     |-- redirect to /authorize ->|
 |                     |                           |
 |<--------------------+<-- redirect with ?code ---|
 |-- GET /auth/callback|                           |
 |                     |-- POST /token (exchange) ->|
 |                     |<-- id_token + access_token-|
 |                     |                           |
 |                     | extract email, name, role |
 |                     | store in server-side session
 |<-- Set-Cookie ------+                           |
 |                     |                           |
 |-- GET /api/me ------>                           |
 |<-- { email, name, role }                        |
```

Session data is stored server-side (`flask-session`, filesystem backend).
The browser holds only a signed, opaque session cookie — no tokens are ever sent to the client.

---

## Admin access

Admin users gain access to the link management panel at `/admin`.

Assign admins by listing their email addresses in `backend/.env`:

```env
ADMIN_EMAILS=alice@company.com,bob@company.com
```

Role resolution is in `backend/app/auth/roles.py`. The current implementation is a simple
email allowlist, isolated so you can swap it for Azure App Roles or group membership checks
without touching anything else.

> **Security note:** The backend enforces `@admin_required` on every write endpoint.
> The frontend hides the admin UI as a UX convenience only — never treat it as a security boundary.

---

## API reference

All endpoints are under `/api`. All responses are JSON.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/me` | — | Returns the current user, or `401` if unauthenticated |

### Links

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/links` | User | All links (admin) or active links only (user) |
| `POST` | `/api/links` | Admin | Create a link |
| `PUT` | `/api/links/<id>` | Admin | Replace a link |
| `PATCH` | `/api/links/<id>/status` | Admin | Toggle `isActive` |
| `DELETE` | `/api/links/<id>` | Admin | Delete a link — returns `204` |

### OAuth routes (browser-facing)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/login` | Redirects to Microsoft sign-in |
| `GET` | `/auth/callback` | OAuth callback, handled by Flask |
| `GET` | `/auth/logout` | Clears session, redirects to Microsoft logout |

### Link schema

**Request body for `POST /api/links` and `PUT /api/links/<id>`:**

```json
{
  "title": "HR Portal",
  "href": "https://hr.company.com",
  "category": "Internal",
  "description": "Access HR self-service",
  "isActive": true,
  "order": 1
}
```

Fields `title`, `href`, and `category` are required. All others are optional.

**Response shape (all link endpoints):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "HR Portal",
  "href": "https://hr.company.com",
  "category": "Internal",
  "description": "Access HR self-service",
  "isActive": true,
  "order": 1,
  "createdAt": "2025-01-01T00:00:00+00:00",
  "updatedAt": "2025-01-01T00:00:00+00:00"
}
```

---

## Production build

The React app is compiled into the Flask static folder so a single process serves everything.

```bash
# 1. Build the frontend
cd frontend
npm run build
# Output: backend/app/static/dist/

# 2. Start the backend
cd backend
uvicorn run:app --port 5000
```

How Flask routes requests in production:

| Path pattern | Served by |
|--------------|-----------|
| `/api/*` | Flask API blueprints |
| `/auth/*` | Flask auth blueprint |
| `/assets/*` | `static/dist/assets/` (Vite-generated JS/CSS) |
| Anything else | `static/dist/index.html` (React Router fallback) |

---

## Testing

```bash
cd backend
pytest           # run all tests
pytest -v        # verbose output
pytest tests/test_api.py -v   # single file
```

| Test file | Coverage |
|-----------|----------|
| `test_api.py` | Endpoint auth, permission checks, create/delete/patch flows |
| `test_blob.py` | Azure Blob read/write with mocked `BlobServiceClient` |
| `test_roles.py` | Email-to-role mapping, case-insensitivity |
| `test_schemas.py` | Pydantic validation — required fields, URL format, blank rejection |

---

## Project structure

```
landing-page/
+-- backend/
|   +-- app/
|   |   +-- __init__.py              App factory; frontend static serving
|   |   +-- api/
|   |   |   +-- routes.py            REST endpoints (/api/*)
|   |   +-- auth/
|   |   |   +-- microsoft.py         OAuth 2.0 flow (login, callback, logout)
|   |   |   +-- decorators.py        @login_required, @admin_required
|   |   |   +-- roles.py             Email -> role mapping
|   |   |   +-- utils.py             Shared helpers
|   |   +-- core/
|   |   |   +-- config.py            Environment config (validates on startup)
|   |   +-- schemas/
|   |   |   +-- link.py              Pydantic input validation
|   |   +-- services/
|   |   |   +-- links/service.py     Link CRUD business logic
|   |   |   +-- storage/blob.py      Azure Blob read/write
|   |   +-- static/dist/             React build output (git-ignored)
|   +-- tests/
|   |   +-- conftest.py              Fixtures (app, admin_session, user_session)
|   |   +-- test_api.py
|   |   +-- test_blob.py
|   |   +-- test_roles.py
|   |   +-- test_schemas.py
|   +-- run.py                       Entry point (Flask dev server + uvicorn ASGI)
|   +-- requirements.txt
|   +-- .env.example
+-- frontend/
|   +-- src/
|   |   +-- app/                     App router, PortalPage, AdminPage
|   |   +-- components/              auth/, admin/, layout/, ui/
|   |   +-- features/
|   |   |   +-- auth/AuthContext.tsx  Auth state + useAuth() hook
|   |   |   +-- links/useLinks.ts    Links fetch + mutation hooks
|   |   +-- lib/
|   |   |   +-- api/client.ts        Typed fetch wrapper (credentials: include)
|   |   |   +-- i18n/index.ts        t() reads messages/en.json
|   |   +-- styles/global.css        CSS design tokens (colours, spacing)
|   |   +-- types/index.ts           Link, User TypeScript interfaces
|   +-- vite.config.ts               Build config + dev proxy to Flask
|   +-- package.json
+-- messages/
|   +-- en.json                      All UI strings (single source of truth for i18n)
+-- .gitignore
+-- README.md
```

---

## Troubleshooting

**`Missing env vars: MICROSOFT_CLIENT_ID, ...` on startup**
Make sure `backend/.env` exists and all required variables are filled in.

**`AADSTS50011: The redirect URI does not match`**
The `REDIRECT_URI` in `.env` must exactly match what is registered in Entra ID.
Check for trailing slashes and `http` vs `https`.

**`ResourceNotFoundError` from Azure Storage on read**
The container and blob are created automatically on first write.
Verify that `AZURE_STORAGE_CONNECTION_STRING` is correct, or run a `POST /api/links` first to initialise the blob.

**Frontend changes not reflected in production**
Re-run `npm run build` in `frontend/` to update `backend/app/static/dist/`.

**Session not persisting across requests**
Ensure `SECRET_KEY` is set and does not change between restarts.
The `flask_session/` directory must be writable by the server process.

**`401 Unauthorized` from `/api/me` when you expect to be logged in**
Confirm the session cookie is being sent. In development, ensure Vite is running
and proxying to Flask on `:5000`, and that `credentials: 'include'` is set in API calls.

# OPC Portal

> A secure internal portal for OPC applications and Copilot agents.
> Built with React + Vite (frontend) and Flask (backend).
> Microsoft-only login. Azure Blob Storage. No database.

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript |
| Backend | Python 3.11+, Flask 3 |
| Auth | Microsoft OAuth 2.0 (backend session-based) |
| Storage | Azure Blob Storage (JSON file) |

---

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 20+
- A Microsoft Entra ID App Registration ([setup guide below](#microsoft-entra-id-setup))
- An Azure Storage account — or [Azurite](#local-blob-emulation) for local dev

---

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # fill in your values (see env vars below)
python run.py                    # starts on http://localhost:5000
```

To run with uvicorn instead:

```bash
uvicorn run:app --reload --port 5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                      # starts on http://localhost:5173
```

Vite automatically proxies `/api` and `/auth` to Flask on `:5000`.

---

## Microsoft Entra ID setup

1. Go to **Azure Portal → Microsoft Entra ID → App registrations → New registration**
2. Name: `OPC Portal`, Supported account types: **Single tenant**
3. Under **Authentication → Add a platform → Web**, add the redirect URI:

   | Environment | Redirect URI |
   |-------------|--------------|
   | Development | `http://localhost:5000/auth/callback` |
   | Production  | `https://your-domain.com/auth/callback` |

4. Enable **ID tokens** under Implicit grant
5. Go to **Certificates & secrets → New client secret** — copy the value
6. From the app overview, copy:
   - **Application (client) ID** → `MICROSOFT_CLIENT_ID`
   - **Directory (tenant) ID** → `MICROSOFT_TENANT_ID`

---

## Auth flow

Authentication is entirely **backend-driven**. The browser never handles a token.

```
1. User visits /auth/login
2. Flask redirects to Microsoft authorization endpoint
3. Microsoft redirects back to /auth/callback with an authorization code
4. Flask exchanges the code for tokens, extracts user info
5. User is stored in a signed server-side session
6. React calls GET /api/me to read the current user
```

---

## Admin role

Admin access is controlled by the `ADMIN_EMAILS` environment variable:

```env
ADMIN_EMAILS=alice@company.com,bob@company.com
```

Role resolution is isolated in `backend/app/auth/roles.py` and can be replaced
with Azure App Roles or group membership checks without touching anything else.

> The backend always enforces role checks on every admin endpoint.
> The frontend hides admin UI as a convenience only — never rely on it for security.

---

## Azure Blob Storage

Portal links are stored as a single JSON file in Azure Blob Storage:

| Setting | Default | Env var |
|---------|---------|---------|
| Container | `portal-data` | `AZURE_STORAGE_CONTAINER` |
| Blob | `links.json` | `AZURE_STORAGE_BLOB_NAME` |

The container and blob are created automatically on first write.

### Local blob emulation

```bash
npm install -g azurite
azurite --silent --location .azurite
```

Then set in `.env`:

```env
AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true
```

---

## Production build

Build the React app and serve everything from Flask:

```bash
# 1. Build frontend
cd frontend && npm run build
# Output goes to: backend/app/static/dist/

# 2. Start backend
cd backend
python run.py
# or: uvicorn run:app --port 5000
```

Flask serves:
- `GET /assets/*` → `static/dist/assets/` (JS, CSS)
- All other non-API paths → `static/dist/index.html` (React Router)

---

## Running tests

```bash
cd backend
pytest
```

Test coverage includes schema validation, blob storage (mocked), role resolution,
and API endpoint permission checks.

---

## Environment variables

All variables belong in `backend/.env` (copy from `backend/.env.example`).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MICROSOFT_CLIENT_ID` | yes | — | App registration client ID |
| `MICROSOFT_TENANT_ID` | yes | — | Azure AD tenant ID |
| `MICROSOFT_CLIENT_SECRET` | yes | — | App registration client secret |
| `AZURE_STORAGE_CONNECTION_STRING` | yes | — | Blob storage connection string |
| `SECRET_KEY` | yes | — | Flask session signing key |
| `ADMIN_EMAILS` | no | *(none)* | Comma-separated admin email list |
| `AZURE_STORAGE_CONTAINER` | no | `portal-data` | Blob container name |
| `AZURE_STORAGE_BLOB_NAME` | no | `links.json` | Blob file name |
| `REDIRECT_URI` | no | `http://localhost:5000/auth/callback` | OAuth callback URI |

> Generate a secure `SECRET_KEY` with:
> `python -c "import secrets; print(secrets.token_hex(32))"`

---

## Project structure

```
landing-page/
  backend/
    app/
      api/routes.py          API endpoints (/api/*)
      auth/
        microsoft.py         OAuth flow
        decorators.py        @login_required, @admin_required
        roles.py             Email-to-role mapping
      services/
        storage/blob.py      Azure Blob read/write
        links/service.py     Link CRUD logic
      schemas/link.py        Pydantic input validation
      core/config.py         Environment config
      static/dist/           React build output (git-ignored)
      __init__.py            App factory
    tests/
    run.py                   Entry point (Flask dev + uvicorn ASGI)
    requirements.txt
    .env.example
  frontend/
    src/
      app/                   App, PortalPage, AdminPage
      components/            auth/, admin/, layout/, ui/
      features/              auth/AuthContext, links/useLinks
      lib/                   api/client, i18n/t()
      styles/global.css      Design tokens + reset
      types/index.ts
    vite.config.ts           Proxies /api and /auth to Flask in dev
  messages/en.json           All UI strings (i18n)
  .gitignore
  README.md
```

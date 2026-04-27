# OPC Portal — Azure Container Apps Deployment Guide

This document explains, step by step, how to build the OPC Portal Docker image and deploy it to **Azure Container Apps**.  
It assumes you have the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed and are logged in (`az login`).

---

## Table of contents

1. [Architecture overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step 1 — Build the Docker image locally](#step-1--build-the-docker-image-locally)
4. [Step 2 — Tag the image for Azure Container Registry](#step-2--tag-the-image-for-azure-container-registry)
5. [Step 3 — Push the image to ACR](#step-3--push-the-image-to-acr)
6. [Step 4 — Create or use the Container Apps environment](#step-4--create-or-use-the-container-apps-environment)
7. [Step 5 — Create the Container App](#step-5--create-the-container-app)
8. [Step 6 — Configure ingress with the correct port](#step-6--configure-ingress-with-the-correct-port)
9. [Step 7 — Set registry authentication using ACR credentials](#step-7--set-registry-authentication-using-acr-credentials)
10. [Step 8 — Add Container App secrets](#step-8--add-container-app-secrets)
11. [Step 9 — Map secrets to environment variables](#step-9--map-secrets-to-environment-variables)
12. [Step 10 — Update Microsoft Entra ID redirect URIs](#step-10--update-microsoft-entra-id-redirect-uris)
13. [Step 11 — Restart / redeploy a revision](#step-11--restart--redeploy-a-revision)
14. [Step 12 — Check logs and debug unhealthy revisions](#step-12--check-logs-and-debug-unhealthy-revisions)

---

## Architecture overview

```
┌──────────────────────────────────────────────────────────────┐
│  Developer machine                                           │
│                                                              │
│  ┌─────────────┐   docker build   ┌──────────────────────┐  │
│  │  Source code │ ──────────────► │  Docker image        │  │
│  │  (Vite/React │                 │  opc-portal:v0.3.0   │  │
│  │  + Flask/    │                 └──────────┬───────────┘  │
│  │  Uvicorn)    │                            │ docker push  │
│  └─────────────┘                            ▼              │
└────────────────────────────────────────────────────────────┘
                                   ┌──────────────────────────┐
                                   │  Azure Container Registry│
                                   │  opcportalregistry       │
                                   │  .azurecr.io             │
                                   └──────────────┬───────────┘
                                                  │ pull on deploy
                                                  ▼
                              ┌────────────────────────────────────┐
                              │  Azure Container Apps              │
                              │  environment: opc-container-env    │
                              │                                    │
                              │  ┌──────────────────────────────┐ │
                              │  │  Container App               │ │
                              │  │  opc-portal-web              │ │
                              │  │  port 8000 (uvicorn)         │ │
                              │  │  HTTPS ingress (public)      │ │
                              │  └──────────────────────────────┘ │
                              └────────────────────────────────────┘
```

**What lives inside the single Docker image:**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Stage 1 (builder) | Node 20 / Vite | Compiles the React/TypeScript frontend |
| Stage 2 (runtime) | Python 3.11 / Uvicorn | Serves the Flask API + pre-built frontend bundle |

The frontend is compiled at image build time and placed in `backend/app/static/dist/`.  
At runtime, Flask serves the SPA bundle as static files, so only **one container** runs.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Azure CLI ≥ 2.53 | `az --version` |
| Docker Desktop / Docker Engine | Running locally |
| `az containerapp` extension | `az extension add --name containerapp` |
| Azure subscription | With the resource group `OPC-AI-Services` already created |
| ACR `opcportalregistry` | Created in the same resource group |
| Microsoft Entra ID app registration | Client ID, Tenant ID, and Client Secret at hand |

Log in to Azure and set your default subscription:

```bash
az login
az account set --subscription "<your-subscription-id>"
```

---

## Step 1 — Build the Docker image locally

The `Dockerfile` uses a **multi-stage build**.  
Stage 1 runs `npm run build`; Stage 2 packages the Python backend + compiled frontend.

Run this from the **project root** (where `Dockerfile` lives):

```bash
docker build -t opc-portal:v0.3.0 .
```

> **Tip:** The first build takes a few minutes because it installs Node modules and Python packages.  
> Subsequent builds are faster thanks to Docker's layer cache.

Verify the image was created:

```bash
docker images opc-portal
```

You should see `opc-portal` with tag `v0.3.0` in the list.

---

## Step 2 — Tag the image for Azure Container Registry

Azure Container Registry expects images to be named with the registry's login server as a prefix.

```bash
docker tag opc-portal:v0.3.0 opcportalregistry.azurecr.io/opc-portal:v0.3.0
```

It is also useful to keep a `latest` tag pointing to the newest version:

```bash
docker tag opc-portal:v0.3.0 opcportalregistry.azurecr.io/opc-portal:latest
```

---

## Step 3 — Push the image to ACR

First, authenticate Docker with your registry:

```bash
az acr login --name opcportalregistry
```

Then push both tags:

```bash
docker push opcportalregistry.azurecr.io/opc-portal:v0.3.0
docker push opcportalregistry.azurecr.io/opc-portal:latest
```

Confirm the image is in ACR:

```bash
az acr repository show-tags \
  --name opcportalregistry \
  --repository opc-portal \
  --output table
```

---

## Step 4 — Create or use the Container Apps environment

A **Container Apps environment** is the shared networking boundary for one or more Container Apps.  
If `opc-container-env` already exists, skip the creation command.

**Check whether the environment exists:**

```bash
az containerapp env show \
  --name opc-container-env \
  --resource-group OPC-AI-Services \
  --output table
```

**Create it (only if it does not exist):**

```bash
az containerapp env create \
  --name opc-container-env \
  --resource-group OPC-AI-Services \
  --location eastus
```

> Replace `eastus` with the Azure region closest to your users if needed.

---

## Step 5 — Create the Container App

This command creates the Container App for the first time.  
It pulls the image from ACR, sets the runtime port, and enables a public HTTPS endpoint.

> **Note:** Secrets and environment variables are added in later steps.  
> For now we just create the app shell so Azure assigns it a domain name.

```bash
az containerapp create \
  --name opc-portal-web \
  --resource-group OPC-AI-Services \
  --environment opc-container-env \
  --image opcportalregistry.azurecr.io/opc-portal:v0.3.0 \
  --target-port 8000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --registry-server opcportalregistry.azurecr.io
```

After this command succeeds, Azure prints the **FQDN** (fully qualified domain name) of your app, for example:

```
https://opc-portal-web.<unique-id>.eastus.azurecontainerapps.io
```

Copy this URL — you will need it for the Entra ID redirect URI in [Step 10](#step-10--update-microsoft-entra-id-redirect-uris).

---

## Step 6 — Configure ingress with the correct port

The Uvicorn server inside the container listens on **port 8000**.  
The ingress setting tells Azure Container Apps where to forward incoming HTTPS traffic.

If you already set `--target-port 8000` during creation, this step is already done.  
To update it later, run:

```bash
az containerapp ingress update \
  --name opc-portal-web \
  --resource-group OPC-AI-Services \
  --target-port 8000
```

You can verify the ingress configuration:

```bash
az containerapp ingress show \
  --name opc-portal-web \
  --resource-group OPC-AI-Services \
  --output table
```

---

## Step 7 — Set registry authentication using ACR credentials

Container Apps needs credentials to pull the image from your private ACR.

**Get the ACR admin credentials** (admin account must be enabled on the registry):

```bash
az acr credential show \
  --name opcportalregistry \
  --output table
```

This prints a `username` and two `passwords`. Use either password.

**Update the Container App with registry credentials:**

```bash
az containerapp registry set \
  --name opc-portal-web \
  --resource-group OPC-AI-Services \
  --server opcportalregistry.azurecr.io \
  --username opcportalregistry \
  --password "<ACR_PASSWORD>"
```

> Replace `<ACR_PASSWORD>` with one of the passwords printed above.  
> Never commit real passwords to source control.

---

## Step 8 — Add Container App secrets

Secrets are stored encrypted inside the Container App and referenced by name.  
The OPC Portal requires three sensitive values:

| Secret name | Environment variable | Description |
|-------------|---------------------|-------------|
| `ms-client-secret` | `MICROSOFT_CLIENT_SECRET` | Entra ID client secret |
| `azure-storage-conn-str` | `AZURE_STORAGE_CONNECTION_STRING` | Azure Storage full connection string |
| `app-secret-key` | `SECRET_KEY` | Flask session signing key |

Add all three secrets in one command:

```bash
az containerapp secret set \
  --name opc-portal-web \
  --resource-group OPC-AI-Services \
  --secrets \
    ms-client-secret="<YOUR_MICROSOFT_CLIENT_SECRET>" \
    azure-storage-conn-str="<YOUR_AZURE_STORAGE_CONNECTION_STRING>" \
    app-secret-key="<YOUR_SECRET_KEY>"
```

> Replace each placeholder with the real value — but **never** paste secrets into scripts  
> that are committed to Git. Use a password manager or Azure Key Vault to retrieve them.

Verify the secrets exist (values are hidden):

```bash
az containerapp secret list \
  --name opc-portal-web \
  --resource-group OPC-AI-Services \
  --output table
```

---

## Step 9 — Map secrets to environment variables

The Flask app reads configuration from **environment variables** (via `os.environ`).  
The next command maps secrets (and plain-text values) to the environment variables the app expects.

```bash
az containerapp env-var set \
  --name opc-portal-web \
  --resource-group OPC-AI-Services \
  --env-vars \
    FLASK_ENV=production \
    MICROSOFT_CLIENT_ID="<YOUR_CLIENT_ID>" \
    MICROSOFT_TENANT_ID="<YOUR_TENANT_ID>" \
    MICROSOFT_CLIENT_SECRET=secretref:ms-client-secret \
    AZURE_STORAGE_CONNECTION_STRING=secretref:azure-storage-conn-str \
    AZURE_STORAGE_CONTAINER=portal-data \
    AZURE_STORAGE_BLOB_NAME=links.json \
    USERS_BLOB_NAME=users.json \
    SECRET_KEY=secretref:app-secret-key \
    ADMIN_EMAILS="admin@yourcompany.com" \
    REDIRECT_URI="https://opc-portal-web.<unique-id>.eastus.azurecontainerapps.io/auth/callback" \
    AZURE_POST_LOGOUT_REDIRECT_URI="https://opc-portal-web.<unique-id>.eastus.azurecontainerapps.io"
```

> `secretref:<name>` tells Azure to inject the secret value at runtime — the value is never  
> stored in plain text in the environment.
>
> Replace `<YOUR_CLIENT_ID>`, `<YOUR_TENANT_ID>`, and the FQDN placeholders with real values.

---

## Step 10 — Update Microsoft Entra ID redirect URIs

The OAuth callback URL must match exactly what is registered in Entra ID.  
After deploying to Azure, add the production URL alongside any existing development URIs.

1. Open the [Azure Portal](https://portal.azure.com)
2. Go to **Microsoft Entra ID → App registrations → OPC Portal → Authentication**
3. Under **Web → Redirect URIs**, add:

   ```
   https://opc-portal-web.<unique-id>.eastus.azurecontainerapps.io/auth/callback
   ```

4. Under **Front-channel logout URL** (optional), add:

   ```
   https://opc-portal-web.<unique-id>.eastus.azurecontainerapps.io
   ```

5. Click **Save**

> The FQDN was printed when you ran `az containerapp create`.  
> You can also retrieve it at any time:
>
> ```bash
> az containerapp show \
>   --name opc-portal-web \
>   --resource-group OPC-AI-Services \
>   --query properties.configuration.ingress.fqdn \
>   --output tsv
> ```

---

## Step 11 — Restart / redeploy a revision

Every time you push a new image or change environment variables, you need to deploy a new revision.

### Deploy a new image version

```bash
# 1. Build and push the new image
docker build -t opcportalregistry.azurecr.io/opc-portal:v0.4.0 .
docker push opcportalregistry.azurecr.io/opc-portal:v0.4.0

# 2. Update the Container App to use the new image
az containerapp update \
  --name opc-portal-web \
  --resource-group OPC-AI-Services \
  --image opcportalregistry.azurecr.io/opc-portal:v0.4.0
```

### Force a restart without changing the image

```bash
az containerapp revision restart \
  --name opc-portal-web \
  --resource-group OPC-AI-Services \
  --revision <revision-name>
```

Get the current revision name:

```bash
az containerapp revision list \
  --name opc-portal-web \
  --resource-group OPC-AI-Services \
  --output table
```

---

## Step 12 — Check logs and debug unhealthy revisions

### View live log stream

```bash
az containerapp logs show \
  --name opc-portal-web \
  --resource-group OPC-AI-Services \
  --follow
```

### View recent logs (no live stream)

```bash
az containerapp logs show \
  --name opc-portal-web \
  --resource-group OPC-AI-Services \
  --tail 50
```

### List all revisions and their status

```bash
az containerapp revision list \
  --name opc-portal-web \
  --resource-group OPC-AI-Services \
  --output table
```

Look at the **Running** and **Healthy** columns.  
A revision shows `0` running replicas when the container fails to start.

### Inspect a specific revision

```bash
az containerapp revision show \
  --name opc-portal-web \
  --resource-group OPC-AI-Services \
  --revision <revision-name>
```

### Common failure causes and fixes

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Container exits immediately | Missing required env var | Check the `validate_env()` output in logs — add the missing secret/env var |
| `ImagePullBackOff` | Wrong ACR credentials or image tag | Re-run Step 7 with the correct password; verify the tag exists with `az acr repository show-tags` |
| `503 Service Unavailable` | Ingress port mismatch | Confirm `--target-port 8000` in Step 6 |
| OAuth callback mismatch | `REDIRECT_URI` env var doesn't match Entra ID | Align Step 9 env var with Step 10 Entra ID URI |
| Session cookie not persisting | `SECRET_KEY` is different between restarts | Use the `secretref` approach from Step 8 so the key is stable |

---

## Quick reference — all project-specific names

| Item | Value |
|------|-------|
| App name | `opc-portal-web` |
| Resource group | `OPC-AI-Services` |
| ACR login server | `opcportalregistry.azurecr.io` |
| Image name | `opc-portal` |
| Container Apps environment | `opc-container-env` |
| Runtime port | `8000` |
| Secrets | `ms-client-secret`, `azure-storage-conn-str`, `app-secret-key` |

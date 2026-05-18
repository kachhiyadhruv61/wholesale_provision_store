# Deployment Guide — Wholesale Store

This document explains how to deploy the Backend and Frontend using Render (backend) and Vercel (frontend).

## Backend — Render (recommended)

1. Create a Render account and connect your GitHub repository.
2. Create a new **Web Service** and select the `main` branch of this repository.
3. Settings:
   - Build Command: leave empty (we use `start` script)
   - Start Command: `npm start --prefix Backend`
   - Environment: set environment variables (see below)
   - Region / instance: choose according to your needs
4. Environment variables to set on Render:
   - `MONGO_URI` — MongoDB connection string
   - `DB_NAME` — database name
   - `PORT` — optional (Render provides its own port)
   - `CORS_ORIGIN` — allowed origins (comma-separated)
   - `MAIL_USER` — Gmail address or SMTP user
   - `MAIL_PASS` — SMTP app password
   - `JWT_SECRET` — a strong secret

5. Deploy — Render will install dependencies and start the app.

Notes:
- We added `Backend/Procfile` and `Backend/.env.example` to help with configuration.
- Verify that `MONGO_URI` and `MAIL_PASS` are kept secret in Render's environment settings.

## Frontend — Vercel

1. Create a Vercel account and connect your GitHub repository.
2. Create a new project from Git and select this repository.
3. In project settings set:
   - Root Directory: `Frontend`
   - Framework Preset: `Create React App`
   - Build Command: `npm run build`
   - Output Directory: `build`
4. Environment variables (if your frontend talks to backend):
   - `REACT_APP_API_URL` — e.g. `https://your-backend.onrender.com`

Vercel will build and deploy the frontend and give you a URL.

## Optional: Remove Secrets from Git History (recommended)

This repo previously contained hard-coded credentials. Although code was updated to use env-vars, secrets remain in history. To remove them:

Option A — BFG Repo-Cleaner (recommended):

1. Install BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Run locally (replace `password` with actual credential patterns):

```bash
git clone --mirror https://github.com/youruser/wholesale_provision_store.git
bfg --replace-text passwords.txt wholesale_provision_store.git
cd wholesale_provision_store.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

Option B — git-filter-repo (more flexible). I can help perform this if you want — it rewrites history and will require force-pushing.

## Next steps I can do for you
- Create GitHub Actions for CI and automatic deploys to Render/Vercel.
- Remove secrets from Git history (I will need your go-ahead).
- Set up a custom domain for frontend/backend and configure HTTPS.

If you want, I can now:
- Create a small GitHub Actions workflow to auto-deploy the `Frontend` to Vercel and the `Backend` to Render (requires Render API key or connecting via GitHub).
- Run the secret-removal procedure (I will guide you and execute safe steps once you confirm).

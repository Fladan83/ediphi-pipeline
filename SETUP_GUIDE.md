# Ediphi Pipeline v2 — Setup & Deployment Guide

## What's New in v2

- **Project & Estimate selector** — browse and select your target from the Ediphi API
- **Metabase integration** — load live UPC catalog directly from data.ediphi.com
- **OST file support** — native On-Screen Takeoff (.ost) parsing with folder/UF3 extraction
- **Vercel API proxy** — credentials stay server-side, no CORS issues
- **Skip login** — file-upload-only mode for offline use

---

## Option A: Deploy to Vercel (Recommended)

### Step 1: Push to GitHub

```bash
cd ~/Desktop
mkdir ediphi-pipeline && cd ediphi-pipeline
git init
```

Copy all the downloaded project files into this folder, then:

```bash
git add .
git commit -m "Ediphi Pipeline v2 - API + Metabase + OST"
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/ediphi-pipeline.git
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"** → select `ediphi-pipeline`
3. Vercel auto-detects Vite. Click **Deploy**.
4. Done — you get a URL like `ediphi-pipeline.vercel.app`

### Step 3: Add Environment Variables

In Vercel dashboard → your project → **Settings** → **Environment Variables**:

| Variable | Value |
|----------|-------|
| `EDIPHI_TENANT` | `dantest` |
| `EDIPHI_TOKEN` | Your Ediphi API token |
| `METABASE_API_KEY` | Your Metabase API key (optional) |
| `METABASE_DEVICE_COOKIE` | Your metabase.DEVICE cookie (optional) |
| `METABASE_DB_ID` | `661` |

After adding, click **Redeploy** to pick up the new variables.

### Step 4: Enable Access Control

In **Settings** → **Deployment Protection**:
- Enable password protection, or
- Invite teammates by email under the team settings

---

## Option B: Run Locally

### Step 1: Install dependencies

```bash
cd ediphi-pipeline
npm install
```

### Step 2: Create .env file

```bash
cp .env.example .env
```

Edit `.env` with your real credentials.

### Step 3: Run with Vercel CLI (for API routes)

```bash
npm i -g vercel
vercel dev
```

This runs both the Vite frontend and the serverless API routes locally.

Or, if you just want the frontend (file-upload-only mode):

```bash
npm run dev
```

Open http://localhost:5173. Click "Skip" on login to use file uploads only.

---

## Project Structure

```
ediphi-pipeline/
  index.html
  package.json
  vite.config.js
  vercel.json               <- API route config
  .env.example              <- Credentials template
  .gitignore
  api/
    ediphi/index.js          <- Proxy to api.ediphi.com (serverless)
    metabase/index.js        <- Proxy to data.ediphi.com (serverless)
  public/
    vite.svg
  src/
    index.css
    main.jsx
    App.jsx                  <- Full pipeline app (1400 lines)
```

---

## Architecture: How the Proxy Works

```
Browser (React App)
    |
    |-- POST /api/ediphi     -->  Vercel Serverless  -->  api.ediphi.com
    |                              (adds api-tenant + api-token headers)
    |
    |-- POST /api/metabase   -->  Vercel Serverless  -->  data.ediphi.com
                                   (adds X-API-KEY + Cookie headers)
```

Your credentials never leave the server. The browser only talks to your Vercel deployment.

---

## Features

### Login
- **Connected mode**: Enter tenant + API token to enable project browsing
- **Skip mode**: Use file uploads and sample data only (no API needed)
- **Metabase** (optional): Adds live UPC catalog loading from Ediphi DB

### UPC Loader
- Load from Metabase (live, when connected)
- Upload CSV/XLSX file
- Sample data (30 items for testing)

### Takeoff Pipeline
- Supports XLSX, CSV, XML, and native OST files
- Weighted matching: Name 35%, UoM 20%, MF3 15%, UF3 10%, MF2 8%, UF2 5%, BP 4%, Cat 3%
- Review/confirm/reject matches, pick alternatives
- CSV export with all sort fields

### Accounting Pipeline
- Sage 100/300 job cost imports
- Cost type splitting (L/M/E/S)
- Proportional distribution by estimated cost
- Labor-only productivity calculations
- Write-back CSV export

---

## Troubleshooting

**API calls return 500** — Check that environment variables are set in Vercel dashboard

**Metabase connection fails** — The device cookie may have expired. Log into data.ediphi.com in your browser, copy the new metabase.DEVICE cookie value, and update the env var

**OST files not parsing** — Make sure the file has a .ost extension. The parser expects the On-Screen Takeoff XML format with BidCondition elements

**CORS errors locally** — Use `vercel dev` instead of `npm run dev` to enable the API proxy routes locally

**Styles missing** — Make sure `src/index.css` contains `@import "tailwindcss";`

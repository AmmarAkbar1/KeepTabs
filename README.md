# KeepTabs

A cross-platform tab and expense tracker for splitting expenses and managing debts with friends and partners. Built with **Tauri v2**, **React**, **TypeScript**, and **Supabase**.

## Features

- **Shared Balances:** See who owes whom at a glance with live color-coded totals.
- **Track Expenses:** Add transactions with formatted dollar amounts and reasons.
- **Approval System:** Pending charges require your partner's approval before settling into the balance.
- **Cross-Platform:** Works on Desktop (Windows, macOS, Linux) and Mobile (Android).
- **Secure Accounts:** User authentication, profiles, and account management powered by Supabase.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, React Router
- **Runtime:** Tauri v2 (Rust)
- **Backend:** Supabase (PostgreSQL & Authentication)

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### 3. Run the App

```bash
# Run in the browser
npm run dev

# Run as a desktop app
npm run tauri dev

# Run on an Android device
npm run tauri android dev
```

## Build for Production

To create a release build for your desktop:

```bash
npm run tauri build
```

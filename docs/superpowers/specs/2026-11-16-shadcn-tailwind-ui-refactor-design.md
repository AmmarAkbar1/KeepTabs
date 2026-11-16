# KeepTabs UI Refactoring Design Specification: Tailwind CSS v4 & shadcn/ui

- **Date**: 2026-11-16
- **Status**: Approved
- **Author**: Antigravity & Jazim
- **Target Application**: KeepTabs (Tauri + React 19 + TypeScript + Vite)

---

## 1. Executive Summary

This specification outlines the comprehensive refactoring of KeepTabs' frontend interface. The current styling relies on a monolithic 1,011-line CSS file (`src/pages/App.css`) with mixed utility and component classes, legacy browser popups (`window.alert` and `window.confirm`), and duplicated UI logic between views.

The refactored architecture establishes:
1. **Tailwind CSS v4** via `@tailwindcss/vite` for fast, zero-config utility styling.
2. **shadcn/ui Primitives** configured with Radix UI, Lucide React icons, and Class Variance Authority (`cva`).
3. **Cohesive Dark Mode Design System** preserving KeepTabs' signature dark charcoal surface palette (`#09090b` / `#121215`) paired with mint/emerald accents (`#00febe`) and debt warning indicators (`#f43f5e`).
4. **Modern Feedback Primitives**: Replacing native browser alerts and confirms with shadcn `AlertDialog` and Sonner toast notifications.
5. **Modular Component Hierarchy**: Decomposing repetitive screen logic into reusable layout and domain components (`AppHeader`, `BalanceHero`, `PartnerCard`, `TransactionItem`, `CreateTabCard`).
6. **Complete Retirement of Legacy CSS**: Complete removal of `src/pages/App.css`.

---

## 2. Tooling, Configuration & Theme Foundation

### 2.1 Dependencies
* **Core & Build**:
  * `tailwindcss` (v4)
  * `@tailwindcss/vite`
  * `@types/node` (dev dependency for path resolution)
* **UI & Primitives**:
  * `@radix-ui/react-avatar`
  * `@radix-ui/react-dropdown-menu`
  * `@radix-ui/react-alert-dialog`
  * `@radix-ui/react-slot`
  * `class-variance-authority`
  * `clsx`
  * `tailwind-merge`
  * `lucide-react`
  * `sonner`

### 2.2 Path Aliasing
* **`tsconfig.json`**:
  ```json
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
  ```
* **`vite.config.ts`**:
  * Import `tailwindcss` from `@tailwindcss/vite` and add to `plugins`.
  * Add path resolution for `@` pointing to `src`.

### 2.3 Utility Setup
* **`src/lib/utils.ts`**:
  ```ts
  import { clsx, type ClassValue } from "clsx";
  import { twMerge } from "tailwind-merge";

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```

### 2.4 Design Tokens & Styling (`src/index.css`)
Tailwind CSS v4 entry point with CSS variable definitions:
```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 6%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 6%;
    --popover-foreground: 0 0% 98%;
    --primary: 165 100% 49.8%;
    --primary-foreground: 240 10% 3.9%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 347 89% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 165 100% 49.8%;
    --radius: 0.75rem;
  }

  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    font-feature-settings: "rlig" 1, "calt" 1;
    min-height: 100vh;
    margin: 0;
  }
}
```

---

## 3. Component Architecture

### 3.1 Base shadcn Primitives (`src/components/ui/`)
1. **`button.tsx`**: Standard shadcn button with variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and loading spinner support.
2. **`input.tsx`**: Styled text/email/password input with focus rings and disabled styling.
3. **`textarea.tsx`**: Styled multi-line input for tab explanations.
4. **`card.tsx`**: Container components (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
5. **`badge.tsx`**: Status indicator badge with variants (`default`, `secondary`, `destructive`, `outline`, `success`).
6. **`avatar.tsx`**: Radix Avatar primitive with fallback letter representation.
7. **`dropdown-menu.tsx`**: Radix DropdownMenu primitive for user profile dropdown.
8. **`alert-dialog.tsx`**: Radix AlertDialog primitive for modal confirmations.
9. **`sonner.tsx`**: Toast component wrapping Sonner.

### 3.2 Domain & Layout Components (`src/components/`)
1. **`layout/AppHeader.tsx`**:
   - KeepTabs logo with navigation link to home.
   - Optional `backTo` path or onClick arrow button for child views (`/partner`).
   - Partner username display when in partner context.
   - User profile dropdown menu (User details, Sign Out action, Delete Account action).
   - Embedded `AlertDialog` confirming account deletion before invoking Supabase `rpc("delete_user")`.
2. **`BalanceHero.tsx`**:
   - Single reusable financial hero card.
   - Supports **Global Mode** (total net balance, status pill "Owed to you" / "You owe overall" / "All Settled", and stats breakdown of owed vs owing).
   - Supports **Partner Mode** (net balance relative to a specific partner with positive/negative color accents).
3. **`PartnerCard.tsx`**:
   - Displays partner avatar with deterministic color hashing based on username.
   - Shows username, email, and current balance badge.
   - Hover animations and chevron navigation to `/partner`.
4. **`TransactionItem.tsx`**:
   - Individual transaction display with explanation, timestamp, and signed balance amount.
   - Status badge (`Pending`, `Approved`, `Declined`).
   - Contextual action buttons: "Approve" (green) and "Deny" (red) when approval is required from the current user.
5. **`CreateTabCard.tsx`**:
   - Card wrapper with amount input (enforcing up to 2 decimal places) and optional explanation textarea.
   - Action buttons: "Request Tab" (payee = partner) vs "Pay Tab" (payee = user).
   - Toast feedback via Sonner on validation or submission errors.

---

## 4. Screen-by-Screen Specifications

### 4.1 Root & Layout (`src/App.tsx`)
- Mount `<Toaster position="top-center" richColors theme="dark" />`.
- Retain global Supabase Realtime listeners for incoming tab requests and approvals.
- Wrap `<Outlet />` in a full-height container with mobile safe-area padding (`pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`).

### 4.2 Authentication (`src/pages/LogIn.tsx` & `src/pages/Register.tsx`)
- Centered container (`min-h-screen flex items-center justify-center p-4`).
- Elevated Card container (`max-w-md w-full border-border bg-card/60 backdrop-blur`).
- Form fields using shadcn `Input`, `Label`, and `Button` with loading spinner.
- Inline error messages and Sonner toast error notifications.
- Direct links between LogIn and Register views.

### 4.3 Home Dashboard (`src/pages/Home.tsx`)
- Top banner: `AppHeader`.
- Primary Hero: `BalanceHero` in global mode.
- Partners section:
  - Header with title "Partners" and count badge.
  - Search input with Lucide `Search` icon for filtering partners in real time by username/email.
  - Partner list rendered using `PartnerCard`.
  - Empty state when no partners exist or match query.
  - Retain Supabase Realtime listeners for transaction and debt updates.

### 4.4 Partner View (`src/pages/Partner.tsx`)
- Top banner: `AppHeader` with back button to `/` and partner username.
- Hero: `BalanceHero` in partner mode.
- Action form: `CreateTabCard` with quick tab creation and toast notification feedback.
- Transaction history:
  - Sorted with pending approvals first, then chronological order.
  - List rendered via `TransactionItem`.
  - "Show more" / "Show less" toggle for long histories.
  - Empty state when no transactions exist.

---

## 5. Migration & Deprecation Strategy

1. **Delete `src/pages/App.css`**: Remove all imports from `Home.tsx`, `Partner.tsx`, `LogIn.tsx`, `Register.tsx`.
2. **Clean up HTML & Meta**: Update `index.html` title and viewport meta tags for modern mobile viewport scaling.
3. **Type Safety & Build Verification**: Ensure zero TypeScript errors (`tsc --noEmit`) and successful bundle creation (`vite build`).

---

## 6. Success Criteria

1. All 4 screens (`LogIn`, `Register`, `Home`, `Partner`) refactored cleanly with Tailwind utility classes and shadcn components.
2. Complete elimination of custom CSS rules from `src/pages/App.css`.
3. Account deletion and transaction actions use modal dialogs (`AlertDialog`) and toasts (`Sonner`) instead of `window.confirm` and `window.alert`.
4. Dark mode styling consistently applied across all surfaces, inputs, buttons, and badges.
5. All tests and Vite production builds pass without errors.

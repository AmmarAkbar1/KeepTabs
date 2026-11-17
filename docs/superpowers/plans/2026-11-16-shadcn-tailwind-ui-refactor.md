# KeepTabs UI Refactoring: Tailwind CSS v4 & shadcn/ui Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the entire KeepTabs user interface to Tailwind CSS v4 and shadcn/ui, establishing a modern dark mode design system, replacing browser popups with accessible modal dialogs and toasts, modularizing components, and retiring the 1,011-line legacy `App.css`.

**Architecture:** Tailwind CSS v4 integrated via `@tailwindcss/vite` with `@/*` path aliases. Reusable shadcn/ui primitives built on Radix UI, Class Variance Authority, and Lucide icons. Modular domain components (`AppHeader`, `BalanceHero`, `PartnerCard`, `TransactionItem`, `CreateTabCard`) power all 4 views (`LogIn`, `Register`, `Home`, `Partner`).

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, `@tailwindcss/vite`, `@radix-ui/react-*`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `sonner`, `@supabase/supabase-js`, Tauri v2.

**Spec:** `docs/superpowers/specs/2026-11-16-shadcn-tailwind-ui-refactor-design.md`

## Global Constraints

- Lock to dark theme by default using CSS tokens matching KeepTabs charcoal backgrounds (`#09090b` / `#121215`) and mint/emerald highlights (`#00febe`).
- Replace native `window.alert` and `window.confirm` with shadcn `AlertDialog` and Sonner toasts.
- Mobile and desktop responsive design supporting Tauri safe areas (`env(safe-area-inset-top)`).
- Complete elimination and deletion of `src/pages/App.css`.
- Ensure TypeScript compilation (`npm run build`) passes cleanly with zero errors after every task.

---

### Task 1: Install Dependencies & Configure Tooling

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json:9-24`
- Modify: `vite.config.ts:1-20`
- Create: `src/lib/utils.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` in `src/lib/utils.ts`
- Produces: Path alias `@/*` resolving to `src/*`

- [ ] **Step 1: Install Tailwind v4, Radix primitives, Lucide, and Sonner**

Run command:
```bash
npm install tailwindcss @tailwindcss/vite clsx tailwind-merge class-variance-authority lucide-react sonner @radix-ui/react-avatar @radix-ui/react-dropdown-menu @radix-ui/react-alert-dialog @radix-ui/react-slot
npm install -D @types/node
```

- [ ] **Step 2: Update `tsconfig.json` with path aliases**

Modify `tsconfig.json` compilerOptions:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Update `vite.config.ts` with Tailwind v4 plugin and `@` alias**

Modify `vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import process from "node:process";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
```

- [ ] **Step 4: Create `src/lib/utils.ts`**

Write `src/lib/utils.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Verify build compiles**

Run: `npm run build`
Expected: Output succeeds without errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts src/lib/utils.ts
git commit -m "chore: setup tailwind css v4, path aliases, and utilities"
```

---

### Task 2: Configure CSS Design Tokens & Base Theme

**Files:**
- Create: `src/index.css`
- Modify: `src/main.tsx:1-10`
- Modify: `index.html:1-20`

**Interfaces:**
- Produces: Global dark mode styling with tokens `--background`, `--card`, `--primary`, `--destructive`, `--border`, `--muted`.

- [ ] **Step 1: Create `src/index.css` with Tailwind v4 imports and design tokens**

Write `src/index.css`:
```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;

    --card: 240 10% 6.5%;
    --card-foreground: 0 0% 98%;

    --popover: 240 10% 6.5%;
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

    --border: 240 3.7% 17%;
    --input: 240 3.7% 17%;
    --ring: 165 100% 49.8%;

    --radius: 0.75rem;
  }

  * {
    border-color: hsl(var(--border));
  }

  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    font-feature-settings: "rlig" 1, "calt" 1;
    min-height: 100vh;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
```

- [ ] **Step 2: Import `src/index.css` in `src/main.tsx`**

Edit `src/main.tsx`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Home from "./pages/Home";
import LogIn from "./pages/LogIn";
import Partner from "./pages/Partner";
import Register from "./pages/Register";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css";

let router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/login", element: <LogIn /> },
      { path: "/partner", element: <Partner /> },
      { path: "/register", element: <Register /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

- [ ] **Step 3: Update `index.html` for dark theme and safe-area viewport**

Modify `index.html`:
```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/app-icon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>KeepTabs</title>
  </head>
  <body class="bg-background text-foreground select-none antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/main.tsx index.html
git commit -m "feat(ui): add theme design tokens and tailwind base styles"
```

---

### Task 3: Build shadcn UI Primitives

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/avatar.tsx`
- Create: `src/components/ui/dropdown-menu.tsx`
- Create: `src/components/ui/alert-dialog.tsx`
- Create: `src/components/ui/sonner.tsx`

**Interfaces:**
- Produces: `Button`, `Input`, `Textarea`, `Card`, `Badge`, `Avatar`, `DropdownMenu`, `AlertDialog`, `Toaster`

- [ ] **Step 1: Create `src/components/ui/button.tsx`**

Write `src/components/ui/button.tsx`:
```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

- [ ] **Step 2: Create `src/components/ui/input.tsx` and `src/components/ui/textarea.tsx`**

Write `src/components/ui/input.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-card/60 px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
```

Write `src/components/ui/textarea.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-input bg-card/60 px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
```

- [ ] **Step 3: Create `src/components/ui/card.tsx` and `src/components/ui/badge.tsx`**

Write `src/components/ui/card.tsx`:
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

Write `src/components/ui/badge.tsx`:
```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground border-border",
        success: "border-transparent bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
        danger: "border-transparent bg-rose-500/15 text-rose-400 border border-rose-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

- [ ] **Step 4: Create `src/components/ui/avatar.tsx`**

Write `src/components/ui/avatar.tsx`:
```tsx
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full font-semibold text-white",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
```

- [ ] **Step 5: Create `src/components/ui/dropdown-menu.tsx`**

Write `src/components/ui/dropdown-menu.tsx`:
```tsx
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-card p-1.5 text-card-foreground shadow-xl animate-in fade-in-80",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuRadioGroup,
};
```

- [ ] **Step 6: Create `src/components/ui/alert-dialog.tsx`**

Write `src/components/ui/alert-dialog.tsx`:
```tsx
import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-2xl duration-200 rounded-2xl animate-in zoom-in-95",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0",
      className
    )}
    {...props}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants({ variant: "destructive" }), className)}
    {...props}
  />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)}
    {...props}
  />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
```

- [ ] **Step 7: Create `src/components/ui/sonner.tsx`**

Write `src/components/ui/sonner.tsx`:
```tsx
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
```

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/ui/
git commit -m "feat(ui): add core shadcn ui primitives"
```

---

### Task 4: Mount Global Feedback & SafeArea Layout in `App.tsx`

**Files:**
- Modify: `src/App.tsx:1-76`

**Interfaces:**
- Consumes: `Toaster` from `@/components/ui/sonner`
- Produces: Persistent toast container across all screens

- [ ] **Step 1: Update `src/App.tsx` with Toaster and container wrapper**

Edit `src/App.tsx`:
```tsx
import { useEffect } from "react";
import { Outlet } from "react-router";
import { supabase } from "./lib/supabase";
import { notify } from "./lib/notifications";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  useEffect(() => {
    let channel: any;

    async function setupRealtimeListener() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const currentUserId = session.user.id;

      channel = supabase
        .channel("global-realtime-transactions")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "transactions",
          },
          (payload) => {
            const newTx = payload.new;
            if (newTx.recipient_id === currentUserId && newTx.creator_id !== currentUserId) {
              notify(
                "New Tab Request",
                `A partner requested \$${parseFloat(newTx.amount).toFixed(2)}: "${newTx.explanation || "No reason"}"`
              );
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "transactions",
          },
          (payload) => {
            const updatedTx = payload.new;
            if (updatedTx.payee_id === currentUserId && updatedTx.approval === "true") {
              notify(
                "Tab Approved! 🎉",
                `Your tab for \$${parseFloat(updatedTx.amount).toFixed(2)} was approved.`
              );
            }
          }
        )
        .subscribe();
    }

    setupRealtimeListener();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setupRealtimeListener();
      } else if (channel) {
        supabase.removeChannel(channel);
      }
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Outlet />
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): add global sonner toaster and safe-area wrapper in App"
```

---

### Task 5: Refactor Auth Screens (`LogIn.tsx` & `Register.tsx`)

**Files:**
- Modify: `src/pages/LogIn.tsx:1-63`
- Modify: `src/pages/Register.tsx:1-79`

**Interfaces:**
- Consumes: `Button`, `Input`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- Consumes: `toast` from `sonner`

- [ ] **Step 1: Refactor `src/pages/LogIn.tsx`**

Replace `src/pages/LogIn.tsx` with:
```tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import appLogo from "@/assets/app-icon.png";
import { Loader2 } from "lucide-react";

export default function LogIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      toast.error("Login failed: " + error.message);
      setLoading(false);
    } else {
      toast.success("Welcome back!");
      navigate("/", { replace: true });
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img src={appLogo} alt="KeepTabs" className="h-16 w-16 drop-shadow-md" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">
            Welcome to KeepTabs
          </CardTitle>
          <CardDescription>
            Enter your email and password to access your tabs
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogIn}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="rounded-lg bg-destructive/15 border border-destructive/20 p-3 text-sm text-destructive font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email
              </label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Logging in..." : "Log In"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
```

- [ ] **Step 2: Refactor `src/pages/Register.tsx`**

Replace `src/pages/Register.tsx` with:
```tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import appLogo from "@/assets/app-icon.png";
import { Loader2 } from "lucide-react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      toast.error("Registration failed: " + error.message);
      setLoading(false);
    } else {
      toast.success("Account created successfully!");
      navigate("/", { replace: true });
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img src={appLogo} alt="KeepTabs" className="h-16 w-16 drop-shadow-md" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">
            Create an Account
          </CardTitle>
          <CardDescription>
            Join KeepTabs to split expenses and track shared debts
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="rounded-lg bg-destructive/15 border border-destructive/20 p-3 text-sm text-destructive font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Username
              </label>
              <Input
                type="text"
                placeholder="coolpartner"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email
              </label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating Account..." : "Register"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Log In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/LogIn.tsx src/pages/Register.tsx
git commit -m "feat(ui): refactor login and register screens with shadcn ui"
```

---

### Task 6: Build Shared Domain Components (`AppHeader`, `BalanceHero`, `PartnerCard`)

**Files:**
- Create: `src/components/layout/AppHeader.tsx`
- Create: `src/components/BalanceHero.tsx`
- Create: `src/components/PartnerCard.tsx`

**Interfaces:**
- Produces: `AppHeader`, `BalanceHero`, `PartnerCard`

- [ ] **Step 1: Create `src/components/layout/AppHeader.tsx`**

Write `src/components/layout/AppHeader.tsx`:
```tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import appLogo from "@/assets/app-icon.png";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, LogOut, Trash2, MoreVertical } from "lucide-react";

export const AVATAR_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#059669",
  "#d97706",
  "#0891b2",
  "#4f46e5",
];

export function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface AppHeaderProps {
  username?: string;
  backTo?: string;
  title?: string;
}

export function AppHeader({ username = "User", backTo, title }: AppHeaderProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    const { error } = await supabase.rpc("delete_user");
    if (error) {
      toast.error("Failed to delete account: " + error.message);
    } else {
      await supabase.auth.signOut();
      toast.success("Your account has been deleted.");
      navigate("/login");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {backTo && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(backTo)}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}

            <Link to="/" className="flex items-center gap-2 group">
              <img
                src={appLogo}
                alt="KeepTabs"
                className="h-8 w-8 transition-transform group-hover:scale-105 drop-shadow-sm"
              />
              <span className="font-bold text-lg tracking-tight text-foreground hidden sm:inline">
                KeepTabs
              </span>
            </Link>

            {title && (
              <div className="flex items-center gap-2 pl-2 border-l border-border text-foreground font-semibold">
                <span>{title}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 py-1.5 h-auto rounded-full hover:bg-accent focus-visible:ring-1"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      style={{ backgroundColor: getAvatarColor(username) }}
                    >
                      {getInitials(username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm hidden sm:inline max-w-[120px] truncate">
                    {username}
                  </span>
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-foreground truncate">{username}</p>
                  <p className="text-xs text-muted-foreground">KeepTabs Member</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="gap-2 text-destructive focus:bg-destructive/15 focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Account</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all associated data from KeepTabs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount}>
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

- [ ] **Step 2: Create `src/components/BalanceHero.tsx`**

Write `src/components/BalanceHero.tsx`:
```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GlobalBalanceHeroProps {
  mode: "global";
  totalNet: number;
  totalOwed: number;
  totalOwing: number;
}

interface PartnerBalanceHeroProps {
  mode: "partner";
  partnerName: string;
  balance: number;
}

export type BalanceHeroProps = GlobalBalanceHeroProps | PartnerBalanceHeroProps;

export function BalanceHero(props: BalanceHeroProps) {
  if (props.mode === "partner") {
    const isPositive = props.balance > 0.005;
    const isNegative = props.balance < -0.005;

    const formattedAmount = isPositive
      ? `+$${props.balance.toFixed(2)}`
      : isNegative
      ? `-$${Math.abs(props.balance).toFixed(2)}`
      : "$0.00";

    return (
      <Card className="border-border bg-card/60 backdrop-blur shadow-md">
        <CardContent className="p-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Balance with {props.partnerName}
            </span>
            <Badge
              variant={isPositive ? "success" : isNegative ? "danger" : "outline"}
            >
              {isPositive
                ? "Owed to you"
                : isNegative
                ? "You owe"
                : "Settled"}
            </Badge>
          </div>

          <div
            className={cn(
              "text-4xl sm:text-5xl font-black tracking-tight",
              isPositive
                ? "text-emerald-400"
                : isNegative
                ? "text-rose-400"
                : "text-muted-foreground"
            )}
          >
            {formattedAmount}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Global mode
  const isNetPositive = props.totalNet > 0.005;
  const isNetNegative = props.totalNet < -0.005;

  const formattedNet = isNetPositive
    ? `+$${props.totalNet.toFixed(2)}`
    : isNetNegative
    ? `-$${Math.abs(props.totalNet).toFixed(2)}`
    : "$0.00";

  return (
    <Card className="border-border bg-card/60 backdrop-blur shadow-md overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
            Total Net Balance
          </span>
          <Badge
            variant={isNetPositive ? "success" : isNetNegative ? "danger" : "outline"}
          >
            {isNetPositive
              ? "Owed to you"
              : isNetNegative
              ? "You owe overall"
              : "All Settled"}
          </Badge>
        </div>

        <div
          className={cn(
            "text-4xl sm:text-5xl font-black tracking-tight",
            isNetPositive
              ? "text-emerald-400"
              : isNetNegative
              ? "text-rose-400"
              : "text-muted-foreground"
          )}
        >
          {formattedNet}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/80">
          <div>
            <p className="text-xs text-muted-foreground font-medium">You are owed</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-400">
              +${props.totalOwed.toFixed(2)}
            </p>
          </div>
          <div className="border-l border-border/80 pl-4">
            <p className="text-xs text-muted-foreground font-medium">You owe</p>
            <p className="text-lg sm:text-xl font-bold text-rose-400">
              -${props.totalOwing.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create `src/components/PartnerCard.tsx`**

Write `src/components/PartnerCard.tsx`:
```tsx
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAvatarColor, getInitials } from "@/components/layout/AppHeader";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerCardProps {
  id: string;
  username: string;
  email: string;
  balance: number;
  onClick: () => void;
}

export function PartnerCard({
  username,
  email,
  balance,
  onClick,
}: PartnerCardProps) {
  const isPositive = balance > 0.005;
  const isNegative = balance < -0.005;

  const formattedBalance = isPositive
    ? `+$${balance.toFixed(2)}`
    : isNegative
    ? `-$${Math.abs(balance).toFixed(2)}`
    : "$0.00";

  return (
    <div
      onClick={onClick}
      className="group flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-card/90 transition-all cursor-pointer shadow-sm hover:shadow-md"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <Avatar className="h-11 w-11 shadow-sm">
          <AvatarFallback style={{ backgroundColor: getAvatarColor(username) }}>
            {getInitials(username)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <h4 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
            {username}
          </h4>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Badge
          variant={isPositive ? "success" : isNegative ? "danger" : "outline"}
          className="text-xs px-2.5 py-1 font-semibold"
        >
          {formattedBalance}
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/AppHeader.tsx src/components/BalanceHero.tsx src/components/PartnerCard.tsx
git commit -m "feat(ui): add AppHeader, BalanceHero, and PartnerCard components"
```

---

### Task 7: Refactor Home Dashboard (`Home.tsx`)

**Files:**
- Modify: `src/pages/Home.tsx:1-506`

**Interfaces:**
- Consumes: `AppHeader`, `BalanceHero`, `PartnerCard`
- Consumes: `Input` from `@/components/ui/input`

- [ ] **Step 1: Refactor `src/pages/Home.tsx`**

Replace `src/pages/Home.tsx` with:
```tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notifications";
import { AppHeader } from "@/components/layout/AppHeader";
import { BalanceHero } from "@/components/BalanceHero";
import { PartnerCard } from "@/components/PartnerCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Loader2 } from "lucide-react";

interface PartnerUser {
  id: string;
  username: string;
  email: string;
}

export default function Home() {
  const [username, setUsername] = useState<string>("Loading...");
  const [partners, setPartners] = useState<PartnerUser[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Load user profile
  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();

      if (profile && !error) {
        setUsername(profile.username);
      } else {
        setUsername(session.user.email?.split("@")[0] || "User");
      }
    }

    loadUser();
  }, [navigate]);

  // Fetch debts for current user
  async function fetchDebts(currentUid: string) {
    try {
      const { data: debts, error } = await supabase
        .from("debts")
        .select("user_a, user_b, balance")
        .or(`user_a.eq.${currentUid},user_b.eq.${currentUid}`);

      if (error) {
        console.error("Error fetching debts:", error);
        return;
      }

      const balMap: Record<string, number> = {};
      if (debts) {
        for (const d of debts) {
          const raw = parseFloat(d.balance) || 0;
          if (d.user_a === currentUid) {
            balMap[d.user_b] = raw;
          } else if (d.user_b === currentUid) {
            balMap[d.user_a] = -raw;
          }
        }
      }
      setBalances(balMap);
    } catch (err) {
      console.error("Failed to load debts", err);
    }
  }

  // Load partners & debts
  useEffect(() => {
    async function loadData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, email")
          .neq("id", session.user.id)
          .order("username", { ascending: true });

        if (error) throw error;
        setPartners(data || []);
        await fetchDebts(session.user.id);
      } catch (err) {
        console.error("Error loading partners:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  // Realtime listeners
  useEffect(() => {
    let txChannel: any;
    let debtsChannel: any;

    async function setupRealtimeListeners() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const currentUserId = session.user.id;

      txChannel = supabase
        .channel("realtime-transactions")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "transactions",
          },
          (payload) => {
            const newTx = payload.new;
            if (newTx.recipient_id === currentUserId && newTx.creator_id !== currentUserId) {
              notify(
                "New Tab Request",
                `A partner requested \$${parseFloat(newTx.amount).toFixed(2)}: "${newTx.explanation || "No reason"}"`
              );
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "transactions",
          },
          (payload) => {
            const updatedTx = payload.new;
            if (updatedTx.payee_id === currentUserId && updatedTx.approval === "true") {
              notify(
                "Tab Approved! 🎉",
                `Your tab for \$${parseFloat(updatedTx.amount).toFixed(2)} was approved.`
              );
            }
          }
        )
        .subscribe();

      debtsChannel = supabase
        .channel("realtime-debts-home")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "debts",
          },
          () => {
            fetchDebts(currentUserId);
          }
        )
        .subscribe();
    }

    setupRealtimeListeners();

    return () => {
      if (txChannel) supabase.removeChannel(txChannel);
      if (debtsChannel) supabase.removeChannel(debtsChannel);
    };
  }, []);

  function openPartner(partner: PartnerUser) {
    navigate("/partner", {
      state: {
        partner: partner.username,
        partnerId: partner.id,
      },
    });
  }

  // Net Balance summary calculation
  const balanceValues = Object.values(balances);
  const totalNet = balanceValues.reduce((acc, v) => acc + v, 0);
  const totalOwed = balanceValues.filter((v) => v > 0).reduce((acc, v) => acc + v, 0);
  const totalOwing = balanceValues.filter((v) => v < 0).reduce((acc, v) => acc + Math.abs(v), 0);

  // Filter partners
  const filteredPartners = partners.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.username && p.username.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader username={username} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <BalanceHero
          mode="global"
          totalNet={totalNet}
          totalOwed={totalOwed}
          totalOwing={totalOwing}
        />

        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Partners</h2>
              <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold">
                {partners.length}
              </Badge>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">Loading partners...</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-border rounded-xl bg-card/30 space-y-2">
              <Users className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">No partners found</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery
                  ? "Try searching with a different term"
                  : "Invite friends or wait for members to join"}
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {filteredPartners.map((partner) => (
                <PartnerCard
                  key={partner.id}
                  id={partner.id}
                  username={partner.username}
                  email={partner.email}
                  balance={balances[partner.id] || 0}
                  onClick={() => openPartner(partner)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat(ui): refactor home screen with AppHeader, BalanceHero, and PartnerCards"
```

---

### Task 8: Build `TransactionItem` & `CreateTabCard` and Refactor Partner View (`Partner.tsx`)

**Files:**
- Create: `src/components/TransactionItem.tsx`
- Create: `src/components/CreateTabCard.tsx`
- Modify: `src/pages/Partner.tsx:1-320`

**Interfaces:**
- Produces: `TransactionItem`, `CreateTabCard`
- Consumes: `AppHeader`, `BalanceHero`, `TransactionItem`, `CreateTabCard` in `Partner.tsx`

- [ ] **Step 1: Create `src/components/TransactionItem.tsx`**

Write `src/components/TransactionItem.tsx`:
```tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionItemProps {
  transaction: {
    id: string;
    payee_id: string;
    recipient_id: string;
    creator_id: string;
    amount: string;
    explanation: string;
    created_at: string;
    approval: string;
  };
  currentUserId: string;
  onApprove: (tx: any) => void;
  onDeny: (tx: any) => void;
}

export function TransactionItem({
  transaction,
  currentUserId,
  onApprove,
  onDeny,
}: TransactionItemProps) {
  const isPayee = transaction.payee_id === currentUserId;
  const isCreator = transaction.creator_id === currentUserId;
  const rawAmount = parseFloat(transaction.amount) || 0;

  // Format signed amount
  const displayAmount = isPayee
    ? `+$${rawAmount.toFixed(2)}`
    : `-$${rawAmount.toFixed(2)}`;

  // Determine status
  let status: "pending" | "needs_action" | "approved" | "declined" = "approved";
  if (transaction.approval === "declined") {
    status = "declined";
  } else if (transaction.approval === "false") {
    status = isCreator ? "pending" : "needs_action";
  }

  const formattedDate = new Date(transaction.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="p-4 rounded-xl border border-border bg-card/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-semibold text-foreground break-words">
          {transaction.explanation || "No explanation provided"}
        </p>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
        <span
          className={cn(
            "text-base font-bold",
            status === "declined"
              ? "text-muted-foreground line-through"
              : isPayee
              ? "text-emerald-400"
              : "text-rose-400"
          )}
        >
          {displayAmount}
        </span>

        {status === "needs_action" ? (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="default"
              className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white gap-1 text-xs"
              onClick={() => onApprove(transaction)}
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-8 px-2.5 gap-1 text-xs"
              onClick={() => onDeny(transaction)}
            >
              <X className="h-3.5 w-3.5" />
              Deny
            </Button>
          </div>
        ) : status === "pending" ? (
          <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10">
            Pending
          </Badge>
        ) : status === "declined" ? (
          <Badge variant="destructive" className="opacity-80">
            Declined
          </Badge>
        ) : (
          <Badge variant="success">Approved</Badge>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/CreateTabCard.tsx`**

Write `src/components/CreateTabCard.tsx`:
```tsx
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PlusCircle, MinusCircle } from "lucide-react";

interface CreateTabCardProps {
  partnerName: string;
  onSubmit: (amount: string, explanation: string, isPay: boolean) => Promise<void>;
}

export function CreateTabCard({ partnerName, onSubmit }: CreateTabCardProps) {
  const [amount, setAmount] = useState("");
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dollarRegex = /^\d*\.?\d{0,2}$/;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (dollarRegex.test(val)) {
      setAmount(val);
    }
  };

  const handleSubmit = async (isPay: boolean) => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      toast.error("Please enter a valid amount greater than $0.00");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(amount, explanation.trim(), isPay);
      setAmount("");
      setExplanation("");
      toast.success(
        isPay
          ? `Tab created: ${partnerName} owes you $${num.toFixed(2)}`
          : `Tab created: You owe ${partnerName} $${num.toFixed(2)}`
      );
    } catch (err: any) {
      toast.error("Failed to submit tab: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border bg-card/60 backdrop-blur shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">New Tab</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
                $
              </span>
              <Input
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                inputMode="decimal"
                className="pl-7 font-semibold text-base"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Reason / Explanation
            </label>
            <Textarea
              placeholder="e.g. Lunch, Groceries, Movie ticket"
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            type="button"
            variant="default"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="font-semibold gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            They Owe Me
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="font-semibold gap-1.5 border border-border"
          >
            <MinusCircle className="h-4 w-4" />
            I Owe Them
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Refactor `src/pages/Partner.tsx`**

Replace `src/pages/Partner.tsx` with:
```tsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/layout/AppHeader";
import { BalanceHero } from "@/components/BalanceHero";
import { CreateTabCard } from "@/components/CreateTabCard";
import { TransactionItem } from "@/components/TransactionItem";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { History, ChevronDown, ChevronUp } from "lucide-react";

export default function Partner() {
  const location = useLocation();
  const navigate = useNavigate();

  const [debt, setDebt] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("User");
  const [showAll, setShowAll] = useState(false);

  const partner = location.state?.partner;
  const partnerId = location.state?.partnerId;

  useEffect(() => {
    if (!partnerId) {
      navigate("/");
      return;
    }

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      setUserId(session.user.id);
      setUsername(session.user.user_metadata?.username || "User");
      fetchBalance(session.user.id, partnerId);
      fetchTransactions(session.user.id, partnerId);
    }
    init();
  }, [partnerId, navigate]);

  const fetchBalance = async (uid: string, pid: string) => {
    const [userA, userB] = uid < pid ? [uid, pid] : [pid, uid];

    const { data } = await supabase
      .from("debts")
      .select("balance")
      .eq("user_a", userA)
      .eq("user_b", userB)
      .maybeSingle();

    if (!data) {
      setDebt(0);
      return;
    }

    const val = parseFloat(data.balance) || 0;
    if (userA === uid) {
      setDebt(val);
    } else {
      setDebt(-val);
    }
  };

  const fetchTransactions = async (uid: string, pid: string) => {
    const { data } = await supabase
      .from("transactions")
      .select("id, payee_id, recipient_id, creator_id, amount, explanation, created_at, approval")
      .or(`and(payee_id.eq.${uid},recipient_id.eq.${pid}),and(payee_id.eq.${pid},recipient_id.eq.${uid})`)
      .order("created_at", { ascending: false });

    if (data) setTransactions(data);
  };

  const handleCreateTransaction = async (
    amountVal: string,
    reason: string,
    isPay: boolean
  ) => {
    const payload = isPay
      ? {
          payee_id: userId,
          recipient_id: partnerId,
          creator_id: userId,
          amount: amountVal,
          explanation: reason || "No explanation provided",
          approval: "false",
        }
      : {
          payee_id: partnerId,
          recipient_id: userId,
          creator_id: userId,
          amount: amountVal,
          explanation: reason || "No explanation provided",
          approval: "false",
        };

    const { error } = await supabase.from("transactions").insert([payload]);
    if (error) throw error;
    fetchTransactions(userId, partnerId);
  };

  const handleApproval = async (transaction: any, approval: boolean) => {
    if (approval) {
      await supabase
        .from("transactions")
        .update({ approval: "true" })
        .eq("id", transaction.id);

      const [userA, userB] = userId < partnerId ? [userId, partnerId] : [partnerId, userId];

      const { data: debtRecord } = await supabase
        .from("debts")
        .select("balance")
        .eq("user_a", userA)
        .eq("user_b", userB)
        .maybeSingle();

      const currentBalance = debtRecord ? parseFloat(debtRecord.balance) : 0;
      let truedebt = "";

      if (userA === transaction.payee_id) {
        truedebt = (currentBalance + parseFloat(transaction.amount)).toFixed(2);
      } else if (userA === transaction.recipient_id) {
        truedebt = (currentBalance - parseFloat(transaction.amount)).toFixed(2);
      }

      await supabase.from("debts").upsert(
        {
          user_a: userA,
          user_b: userB,
          balance: truedebt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_a,user_b",
        }
      );

      toast.success("Tab approved!");
      fetchBalance(userId, partnerId);
      fetchTransactions(userId, partnerId);
    } else {
      await supabase
        .from("transactions")
        .update({ approval: "declined" })
        .eq("id", transaction.id);

      toast.info("Tab declined.");
      fetchTransactions(userId, partnerId);
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const getPriority = (t: any) => {
      if (t.approval === "false") {
        return t.creator_id !== userId ? 1 : 2;
      }
      return 3;
    };

    const prioA = getPriority(a);
    const prioB = getPriority(b);
    if (prioA !== prioB) return prioA - prioB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const displayedTransactions = showAll
    ? sortedTransactions
    : sortedTransactions.slice(0, 5);

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader username={username} backTo="/" title={partner} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <BalanceHero
          mode="partner"
          partnerName={partner}
          balance={debt}
        />

        <CreateTabCard
          partnerName={partner}
          onSubmit={handleCreateTransaction}
        />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-bold tracking-tight">Transaction History</h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {transactions.length} total
            </span>
          </div>

          {sortedTransactions.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-border rounded-xl bg-card/30 space-y-2">
              <History className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">No transaction history</p>
              <p className="text-xs text-muted-foreground">
                Create a tab above to start keeping track
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {displayedTransactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  currentUserId={userId}
                  onApprove={(t) => handleApproval(t, true)}
                  onDeny={(t) => handleApproval(t, false)}
                />
              ))}
            </div>
          )}

          {transactions.length > 5 && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="gap-1.5"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show {transactions.length - 5} More
                  </>
                )}
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TransactionItem.tsx src/components/CreateTabCard.tsx src/pages/Partner.tsx
git commit -m "feat(ui): refactor partner view with TransactionItem and CreateTabCard"
```

---

### Task 9: Delete Legacy CSS & Perform Final Build Verification

**Files:**
- Delete: `src/pages/App.css`

**Interfaces:**
- Eliminates 1,011 lines of legacy global and scoped CSS

- [ ] **Step 1: Check for remaining `App.css` imports**

Run: `grep -r "App.css" src/`
Expected: No occurrences found.

- [ ] **Step 2: Remove `src/pages/App.css`**

Run: `rm src/pages/App.css`

- [ ] **Step 3: Run full TypeScript and Vite production build**

Run: `npm run build`
Expected: Zero TypeScript errors, zero CSS errors, and successful bundle output.

- [ ] **Step 4: Commit**

```bash
git rm src/pages/App.css
git commit -m "chore(ui): delete legacy App.css and complete shadcn/tailwind migration"
```

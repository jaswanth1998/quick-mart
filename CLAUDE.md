# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Static Website

This is a **fully static website** (Next.js static export). There is NO server-side rendering, NO server components, NO server actions, and NO API routes. All code runs in the browser. Do NOT introduce any server-side Next.js features such as:
- `'use server'` directives
- Server components (async components that fetch data)
- `cookies()`, `headers()` from `next/headers`
- Server-side Supabase client
- `redirect()` from `next/navigation` in server contexts
- `revalidatePath()`, `revalidateTag()`, or any server-side caching
- `middleware.ts`
- API route handlers (`route.ts`)
- Dynamic routes without `generateStaticParams`

All authentication, data fetching, and mutations happen client-side via the Supabase browser client and React Query hooks.

## Project Overview

Quick Mart (package name: `essostore-app`) is a gas station and convenience store management system. It manages departments, products (SKUs), transactions (merchandise + fuel sales), and todos. Data is stored in Supabase and imported via JSON file uploads.

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build (outputs static files to `out/`)
- `npm run start` — Serve the static build locally
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)

## Architecture

**Stack:** Next.js 15 (App Router, static export), React 19, TypeScript, Ant Design 5, Supabase, TanStack React Query, React Hook Form + Zod

**Build output:** `output: 'export'` in `next.config.ts` — generates static HTML/JS/CSS in `out/` directory. `trailingSlash: true` for hosting compatibility.

**Path alias:** `@/*` maps to `./src/*`

### Route Structure

- `/` — Auth page (sign in / sign up), client component using Supabase Auth
- `/(app)/*` — Protected routes wrapped by `AppLayout` with sidebar navigation. Auth check happens client-side in `src/app/(app)/layout.tsx` using `useUserRole()` hook, redirects to `/` if unauthenticated.
- Pages: `/dashboard`, `/department`, `/product`, `/transaction`, `/upload`, `/todo`, `/users`, `/shift-report`, `/shift-report/view?id=X`, `/cash-counting`, `/daily-tasks`

### Data Layer

- **Supabase client:** Single browser client in `src/lib/supabase/client.ts` — used everywhere (hooks, components, actions).
- **Auth:** Client-side only. The `useUserRole()` hook (`src/hooks/useUserRole.ts`) handles auth checks, profile fetching, and role-based permissions via the browser Supabase client.
- **Hooks:** `src/hooks/` contains React Query hooks (useProducts, useTransactions, useDepartments, useTodos, useShiftReports, useUsers, useCashCounting, useTaskTemplates, useTaskCompletions, etc.) that handle CRUD operations and filtering/pagination directly against Supabase. There are no API routes — all data access goes through Supabase browser client SDK.
- **User actions:** `src/app/(app)/users/actions.ts` contains client-side functions for user creation and password changes via Supabase RPCs (`admin_create_user`, `admin_change_password`). These are NOT server actions — they run in the browser.
- **Reusable table:** `src/components/ui/DataTable.tsx` is a generic Ant Design table wrapper with search, date filtering, pagination, XLSX export, and action columns.

### File Upload System

`src/app/(app)/upload/page.tsx` handles bulk JSON imports with a queue-based processor:
- **Departments:** Expects `Departments.JSON` with `{ "departmentId": { "Description": "..." } }` structure
- **Products:** Expects `SKUs.json` with product objects keyed by product ID. Prices are in cents (divided by 100).
- **Transactions:** Files named by shift number (e.g., `12074.JSON`). Contains transaction arrays with `Attributes` and `InputLineItems`. Monetary values in cents. Merchandise transactions auto-decrement product stock.

### Providers

`src/providers/` contains `antd-theme-provider.tsx` (Ant Design theming) and `query-provider.tsx` (TanStack Query). Both wrap the app in the root layout.

### Deployment

Static files in `out/` can be deployed to Firebase Hosting, S3, GitHub Pages, or any static file server. Requires `.env` file with Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

For Firebase Hosting, use `"public": "out"` in `firebase.json` with a catch-all rewrite to `/index.html` for client-side routing.

### Database Tables

Supabase tables: `departments`, `products`, `transactions`, `todos`, `user_profiles`, `role_permissions`, `shift_reports`, `cash_counting_entries`, `task_templates`, `task_completions`. Migrations are in `migrations/`. The `prompts/` directory contains YAML specs for the project and data schemas.

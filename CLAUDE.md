# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quick Mart (package name: `essostore-app`) is a gas station and convenience store management system. It manages departments, products (SKUs), transactions (merchandise + fuel sales), and todos. Data is stored in Supabase and imported via JSON file uploads.

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run start` — Start production server on port 3000
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type checking (`tsc --noEmit`)

## Architecture

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Ant Design 5, Supabase, TanStack React Query, React Hook Form + Zod

**Path alias:** `@/*` maps to `./src/*`

### Route Structure

- `/` — Auth page (sign in / sign up), client component using Supabase Auth
- `/(app)/*` — Protected routes wrapped by `AppLayout` with sidebar navigation. Auth check happens in `src/app/(app)/layout.tsx` using server-side `getUser()`, redirects to `/` if unauthenticated.
- Pages: `/dashboard`, `/department`, `/product`, `/transaction`, `/upload`, `/todo`

### Data Layer

- **Supabase clients:** Two clients in `src/lib/supabase/` — `client.ts` (browser, used in hooks/components) and `server.ts` (server components/actions, uses cookies)
- **Auth:** `src/lib/auth.ts` provides `getUser()` and `requireAuth()` using the server Supabase client
- **Hooks:** `src/hooks/` contains React Query hooks (useProducts, useTransactions, useDepartments, useTodos) that handle CRUD operations and filtering/pagination directly against Supabase. There are no API routes — all data access goes through Supabase client SDK.
- **Reusable table:** `src/components/ui/DataTable.tsx` is a generic Ant Design table wrapper with search, date filtering, pagination, XLSX export, and action columns.

### File Upload System

`src/app/(app)/upload/page.tsx` handles bulk JSON imports with a queue-based processor:
- **Departments:** Expects `Departments.JSON` with `{ "departmentId": { "Description": "..." } }` structure
- **Products:** Expects `SKUs.json` with product objects keyed by product ID. Prices are in cents (divided by 100).
- **Transactions:** Files named by shift number (e.g., `12074.JSON`). Contains transaction arrays with `Attributes` and `InputLineItems`. Monetary values in cents. Merchandise transactions auto-decrement product stock.

### Providers

`src/providers/` contains `antd-theme-provider.tsx` (Ant Design theming) and `query-provider.tsx` (TanStack Query). Both wrap the app in the root layout.

### Deployment

Docker setup maps container port 3000 to host port 5005. Requires `.env` file with Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### Database Tables

Supabase tables: `departments`, `products`, `transactions`, `todos`. Migrations are in `migrations/`. The `prompts/` directory contains YAML specs for the project and data schemas.
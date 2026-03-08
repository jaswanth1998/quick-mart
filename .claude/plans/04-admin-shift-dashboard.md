---
name: "Admin Shift Dashboard"
description: "Replace the current dashboard with a shift-centric admin command center that aggregates data from transactions, shift reports, cash counting, daily tasks, and inventory into a single operational overview"
status: "completed"
completed_items:
  - "Phase 0: Deleted old dashboard code"
  - "Phase 1: Created useDashboard.ts hook with parallel Supabase queries"
  - "Phase 2: Created 9 dashboard components (DashboardFilters, ShiftTimeline, RevenueKPICards, ShiftBreakdownTable, CashAccountabilityCard, StockAlertsCard, TaskProgressCard, RecentReportsTable, DashboardSkeleton)"
  - "Phase 3: Rewrote dashboard/page.tsx with responsive layout"
  - "Phase 4: Date range support with day/range mode and quick presets"
notes:
  went_well:
    - "Zero TypeScript errors"
    - "Zero lint errors (0 new warnings)"
    - "Production build succeeded"
    - "All internal links use next/link Link component"
  went_wrong: []
  blockers: []
---

# Admin Shift Dashboard

## Context

The current dashboard (`src/app/(app)/dashboard/page.tsx`) is a basic analytics page showing merchandise/fuel/safedrop/lotto/payout summaries from the `transactions` table only. Since then, the app has grown to include shift reports (value stock + drawer stock), cash counting, and daily tasks. The admin needs a single command center that ties all operational data together, organized by **shifts** -- the natural unit of store operations.

### Data Sources Available

| Source | Table | Rows | Key Fields |
|--------|-------|------|------------|
| Transactions | `transactions` | 19,148 | shiftNumber, amount, volume, trn_type (merchandise/fuel/safedrop/lotto/payout), dateTime |
| Products | `products` | 4,038 | stock, low_stock_warning, price, department_id |
| Shift Reports | `shift_reports` | 1+ | report_date, shift_type (7-3/3-11/11-7), status (draft/submitted), store_location, total_d_sales, shift_sales, total_drawer_sold |
| Value Stock | `value_stock_entries` | 8/report | amount_label, start_count, added, sold, end_count, has_mismatch |
| Drawer Stock | `drawer_stock_entries` | 14/report | contents, opening, sold, closing, has_mismatch |
| Cash Counting | `cash_counting_entries` | 0+ | entry_date, shift_type, total_amount, sale_drop, remaining, denomination columns |
| Task Templates | `task_templates` | 0+ | task_name, day_of_week, shift_type (morning/evening), store_location |
| Task Completions | `task_completions` | 0+ | task_date, verification_status (pending/approved/rejected), image_url |
| Users | `user_profiles` | 2 | role (admin/user), username |

---

## Design Overview

The dashboard is divided into **7 sections**, top to bottom. Everything filters by the date and store selected in the top bar.

```
+---------------------------------------------------------------+
| [Date: Today ▼]  [Store: All ▼]   [Today] [Yesterday] [Week]  |
+---------------------------------------------------------------+
| SHIFT TIMELINE STRIP                                           |
| [7-3 Submitted ✓]  [3-11 Draft ●]  [11-7 Not Started ○]      |
+---------------------------------------------------------------+
| KPI CARDS (6)                                                  |
| Total Sales | Merch | Fuel | Safe Drops | Lotto | Payouts     |
+---------------------------------------------------------------+
| SHIFT DETAILS PANEL              | CASH ACCOUNTABILITY         |
| Per-shift breakdown table        | Cash counted vs expected    |
| Merch/Fuel/Safe/Lotto per shift  | Variance alerts             |
+---------------------------------------------------------------+
| STOCK ALERTS                     | DAILY TASKS PROGRESS        |
| Low inventory (products)         | Completed/Pending/Rejected  |
| Value stock mismatches           | Progress bar per shift      |
| Drawer stock mismatches          | Needs verification badge    |
+---------------------------------------------------------------+
| RECENT SHIFT REPORTS TABLE (last 10)                           |
| Date | Shift | Store | Incharge | Status | Sales | Actions    |
+---------------------------------------------------------------+
```

---

## Phase 0: Delete Old Dashboard

**Action:** Replace the content of `src/app/(app)/dashboard/page.tsx` entirely. Remove the old `AnalyticsData` interface, the inline `StatCard` and `SummaryTable` components, and the single-query-to-transactions approach.

---

## Phase 1: Dashboard Data Hook

### New: `src/hooks/useDashboard.ts`

A single custom hook that fetches and aggregates all dashboard data for the selected date/store. Uses React Query with a composite key.

```ts
interface DashboardFilters {
  date: string;        // YYYY-MM-DD (default: today)
  storeLocation: string; // '' = all stores
}

interface DashboardData {
  // Shift timeline
  shifts: {
    shiftType: '7-3' | '3-11' | '11-7';
    reportStatus: 'submitted' | 'draft' | 'not-started';
    incharge: string | null;
    reportId: number | null;
  }[];

  // Revenue KPIs (for the selected date)
  revenue: {
    totalSales: number;       // merchandise + fuel
    merchandiseSales: number;
    fuelSales: number;
    fuelVolume: number;
    safeDrops: number;
    lottoSales: number;
    payouts: number;
  };

  // Per-shift breakdown
  shiftBreakdown: {
    shiftNumber: number;
    merchandise: number;
    fuel: number;
    safeDrops: number;
    lotto: number;
    payouts: number;
  }[];

  // Cash accountability
  cashAccountability: {
    shiftType: string;
    totalCounted: number;
    saleDrops: number;
    remaining: number;
    expectedCash: number; // from transactions safe drops
    variance: number;
  }[];

  // Stock alerts
  stockAlerts: {
    lowInventory: { id: number; description: string; stock: number; warning: number }[];
    valueStockMismatches: { reportId: number; shiftType: string; label: string; expected: number; actual: number }[];
    drawerStockMismatches: { reportId: number; shiftType: string; contents: string; expected: number; actual: number }[];
  };

  // Daily tasks
  taskProgress: {
    totalTasks: number;
    completed: number;
    pendingVerification: number;
    approved: number;
    rejected: number;
  };

  // Recent shift reports (last 10 across all dates)
  recentReports: {
    id: number;
    reportDate: string;
    shiftType: string;
    storeLocation: string;
    shiftIncharge: string;
    status: string;
    totalDSales: number | null;
    shiftSales: number | null;
    totalDrawerSold: number | null;
    createdAt: string;
  }[];
}
```

**Implementation approach:** Make parallel Supabase queries inside a single `queryFn`:
1. `transactions` filtered by dateTime for revenue + shift breakdown
2. `shift_reports` filtered by report_date for shift timeline + recent reports
3. `value_stock_entries` + `drawer_stock_entries` joined via report_id for mismatch alerts
4. `cash_counting_entries` filtered by entry_date for cash accountability
5. `products` where stock <= low_stock_warning for inventory alerts
6. `task_templates` + `task_completions` filtered by task_date/day_of_week for task progress

**Query key:** `['dashboard', date, storeLocation]`

---

## Phase 2: Dashboard Components

All new components in `src/components/dashboard/`:

### 2a. `DashboardFilters.tsx`
- Date picker (HTML date input, consistent with existing dashboard style)
- Store location dropdown (from `STORE_LOCATIONS` constant)
- Quick-select buttons: Today, Yesterday, This Week, This Month
- "This Week" and "This Month" will adjust the date to the start of the range (the hook fetches for a single date by default; for ranges the component can switch behavior)

### 2b. `ShiftTimeline.tsx`
- Horizontal strip showing 3 shift cards side-by-side (responsive: stack on mobile)
- Each card shows:
  - Shift time label (7-3, 3-11, 11-7)
  - Status badge: green "Submitted", yellow "Draft", gray "Not Started"
  - Shift incharge name (or "--" if not started)
  - Click navigates to the shift report (`/shift-report/[id]` or `/shift-report/new`)
- Uses the `shifts` data from the hook

### 2c. `RevenueKPICards.tsx`
- 6 stat cards in a responsive grid (3 cols desktop, 2 cols tablet, 1 col mobile)
- Cards: Total Sales, Merchandise, Fuel (with volume subtitle), Safe Drops, Lotto, Payouts
- Each card: icon, label, value formatted as currency, optional subtitle
- Color-coded icons (green for sales, blue for fuel, purple for drops, orange for lotto, red for payouts)
- Reuse the card styling pattern from the old dashboard (`.card` CSS class)

### 2d. `ShiftBreakdownTable.tsx`
- Table showing per-shift number breakdown of revenue categories
- Columns: Shift #, Merchandise, Fuel, Safe Drops, Lotto, Payouts, Total
- Footer row with totals
- Reuse the clean table styling from the old dashboard's `SummaryTable`

### 2e. `CashAccountabilityCard.tsx`
- Card per shift showing:
  - Cash counted total
  - Sale drops amount
  - Remaining in drawer
  - Expected cash (from transaction safe drops for that shift)
  - Variance = counted - expected (green if 0, red if negative, yellow if positive)
- If no cash counting entry exists for a shift, show "No entry" state
- Link to `/cash-counting` for details

### 2f. `StockAlertsCard.tsx`
- Three collapsible sections:
  1. **Low Inventory** - Products where stock <= low_stock_warning. Show product name, current stock, warning threshold. Link to `/product`
  2. **Value Stock Mismatches** - From today's shift reports. Show denomination label, expected vs actual count. Link to report
  3. **Drawer Stock Mismatches** - From today's shift reports. Show brand, expected vs actual. Link to report
- Badge with count on section header
- Empty state: green checkmark "All clear" if no alerts

### 2g. `TaskProgressCard.tsx`
- Circular or bar progress indicator: completed / total tasks
- Breakdown badges: Approved (green), Pending (orange), Rejected (red)
- "X tasks need verification" call-to-action linking to `/daily-tasks/review`
- Empty state if no task templates configured for today

### 2h. `RecentReportsTable.tsx`
- Simple table of last 10 shift reports (across all dates)
- Columns: Date, Shift, Store, Incharge, Status (badge), D-Sales, Shift Sales, Drawer Sold
- Row click navigates to `/shift-report/[id]`
- Compact styling, no pagination needed (fixed at 10)

---

## Phase 3: Dashboard Page Assembly

### Replace: `src/app/(app)/dashboard/page.tsx`

```
'use client'

- Admin guard via useRequireAdmin()
- DashboardFilters at the top
- Loading skeleton while data fetches
- Responsive grid layout assembling all components:
  1. ShiftTimeline (full width)
  2. RevenueKPICards (full width)
  3. ShiftBreakdownTable (2/3 width) + CashAccountabilityCard (1/3 width)
  4. StockAlertsCard (1/2 width) + TaskProgressCard (1/2 width)
  5. RecentReportsTable (full width)
```

**Loading state:** Skeleton placeholders matching each section's layout (not a single spinner).

**Error state:** Friendly error card with retry button if the hook fails.

**Empty state:** When there's no data for the selected date, show a clean "No shift data for this date" message with a suggestion to select a different date.

---

## Phase 4: Date Range Support

Extend the hook and filters to support date ranges (not just single date):
- Quick-select "This Week" sends `startDate` + `endDate`
- Quick-select "This Month" sends `startDate` + `endDate`
- When a range is active:
  - ShiftTimeline hides (it's only meaningful for a single date)
  - KPI cards show totals across the range
  - ShiftBreakdownTable shows aggregated data
  - RecentReportsTable shows reports within the range
  - Task progress aggregates across the range

Update `DashboardFilters` interface:
```ts
interface DashboardFilters {
  startDate: string;
  endDate: string;
  storeLocation: string;
  mode: 'day' | 'range';
}
```

---

## File Manifest

### New Files (10)

| # | Path | Purpose |
|---|------|---------|
| 1 | `src/hooks/useDashboard.ts` | Aggregated dashboard data hook |
| 2 | `src/components/dashboard/DashboardFilters.tsx` | Date/store/quick-select filters |
| 3 | `src/components/dashboard/ShiftTimeline.tsx` | 3-shift status strip |
| 4 | `src/components/dashboard/RevenueKPICards.tsx` | 6 revenue stat cards |
| 5 | `src/components/dashboard/ShiftBreakdownTable.tsx` | Per-shift revenue table |
| 6 | `src/components/dashboard/CashAccountabilityCard.tsx` | Cash counted vs expected |
| 7 | `src/components/dashboard/StockAlertsCard.tsx` | Low inventory + mismatches |
| 8 | `src/components/dashboard/TaskProgressCard.tsx` | Daily task completion progress |
| 9 | `src/components/dashboard/RecentReportsTable.tsx` | Last 10 shift reports table |
| 10 | `src/components/dashboard/DashboardSkeleton.tsx` | Loading skeleton layout |

### Modified Files (1)

| # | Path | Change |
|---|------|--------|
| 1 | `src/app/(app)/dashboard/page.tsx` | Complete rewrite: delete old code, assemble new components |

### No Database Changes

All data already exists in the current tables. No migration needed.

---

## Implementation Order

### Phase 0: Cleanup
1. Read and understand the old dashboard page (done during planning)

### Phase 1: Data Layer
2. Create `src/hooks/useDashboard.ts` with all parallel Supabase queries
3. Define TypeScript interfaces for the aggregated data

### Phase 2: Components (can be partially parallelized)
4. `DashboardFilters.tsx` - date, store, quick-select buttons
5. `DashboardSkeleton.tsx` - loading state
6. `ShiftTimeline.tsx` - shift status cards
7. `RevenueKPICards.tsx` - 6 KPI cards
8. `ShiftBreakdownTable.tsx` - per-shift revenue table
9. `CashAccountabilityCard.tsx` - cash variance
10. `StockAlertsCard.tsx` - alerts panel
11. `TaskProgressCard.tsx` - task progress
12. `RecentReportsTable.tsx` - recent reports

### Phase 3: Page Assembly
13. Rewrite `dashboard/page.tsx` to compose all components
14. Add responsive layout (grid breakpoints)

### Phase 4: Date Range
15. Extend `useDashboard.ts` to support startDate/endDate
16. Update `DashboardFilters.tsx` with range mode + quick selects

---

## Reuse from Existing Codebase

- **CSS classes:** `.card`, `.btn-primary`, `.btn-secondary`, `.input`, `.select`, `.label`, `.badge-*` from `globals.css`
- **Constants:** `STORE_LOCATIONS`, `SHIFT_TYPES` from `src/lib/shift-report-constants.ts`
- **Hooks pattern:** Follow `useCashCounting.ts` for parallel query aggregation pattern
- **Icons:** lucide-react (already installed): `ShoppingCart`, `Car`/`Fuel`, `DollarSign`, `Trophy`, `Wallet`, `TrendingUp`, `AlertTriangle`, `CheckCircle`, `Clock`, `Package`
- **Admin guard:** `useRequireAdmin()` from `src/hooks/useRequireAdmin.ts`
- **Date utils:** `dayjs` (already installed), `getDefaultDateRange()` from `src/lib/utils.ts`
- **Supabase client:** `createClient()` from `src/lib/supabase/client.ts`

---

## Styling Guidelines

- Match existing app aesthetic: white cards with subtle borders, gray-50 background
- Use the existing `.card` class for containers
- Color palette for KPI cards: green-600, blue-600, purple-600, orange-600, red-600 (matches old dashboard)
- Status badges: green for submitted/approved, yellow/amber for draft/pending, gray for not started, red for rejected/mismatch
- Responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` pattern for cards
- Touch-friendly on mobile (min 44px tap targets)
- No Ant Design components on the dashboard (consistent with current Tailwind-only approach on this page)

---

## Verification

1. `npm run typecheck` - no type errors
2. `npm run lint` - no lint issues
3. `npm run build` - successful production build
4. Manual testing:
   - Load dashboard as admin -> see today's data with all 7 sections
   - Change date -> data updates for selected date
   - Filter by store -> data scopes to that store
   - Click "This Week" -> range mode activates, timeline hides, KPIs show week totals
   - Verify shift timeline shows correct status for each shift
   - Verify KPI numbers match transaction page totals for the same date range
   - Verify stock alerts show products with stock <= low_stock_warning
   - Verify cash accountability shows variance correctly
   - Verify task progress matches daily-tasks page counts
   - Click a shift report row -> navigates to `/shift-report/[id]`
   - Test on mobile viewport (375px) -> cards stack, tables scroll horizontally
   - Non-admin user should be redirected away from dashboard (useRequireAdmin)

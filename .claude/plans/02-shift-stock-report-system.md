---
name: "Shift Stock Report System"
description: "Add shift-based stock reporting pages (Value Stock + Drawer Stock + Review) to replace manual paper sheets for store employees"
status: "completed"
completed_items:
  - "Phase 1: Database migration applied (3 tables + RLS + permissions)"
  - "Phase 2: Constants file + React Query hooks created"
  - "Phase 3: ShiftReportFormProvider, StepIndicator, ReportHeader components"
  - "Phase 4: Wizard pages (value-stock, drawer-stock, review) with table components"
  - "Phase 5: List page with DataTable + view/edit page"
  - "Phase 6: Nav item added to AppLayout + print CSS"
notes:
  went_well: []
  went_wrong: []
  blockers: []
---

## Context

The client needs to replace manual paper stock sheets with a web-based shift reporting system. Store employees currently fill paper sheets each shift to track denomination-based stock (bills) and cigarette/product drawer inventory. This feature integrates into the existing Quick Mart app as new pages under the protected `(app)` route group.

## Key Decisions

- **Store/location:** Hardcoded list in code (not a database table)
- **Denomination & drawer rows:** Fixed/hardcoded constants matching the paper sheet layout (8 denominations, 14 drawer products)
- **Report visibility:** All employees can view all shift reports (useful for shift handoff). Only admins can delete or modify.

---

## Route Structure

```
src/app/(app)/shift-report/
  page.tsx                      -- Reports list (DataTable of all shift reports)
  new/
    layout.tsx                  -- Wizard layout: ShiftReportFormProvider + StepIndicator
    value-stock/page.tsx        -- Step 1: Value Stock Report
    drawer-stock/page.tsx       -- Step 2: Drawer Stock Report
    review/page.tsx             -- Step 3: Review & Submit
  [id]/
    page.tsx                    -- View/edit existing report
```

Single nav entry: `{ path: '/shift-report', label: 'Shift Reports', icon: ClipboardList, resource: 'shift_report' }` in `allNavItems` at `src/components/AppLayout.tsx:27`.

---

## Database (3 tables + permissions)

### Migration: `migrations/add_shift_report_tables.sql`

**Table `shift_reports`** (parent record)
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | identity |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |
| report_date | date | NOT NULL |
| shift_type | varchar | CHECK IN ('7-3','3-11','11-7') |
| shift_incharge | text | NOT NULL |
| store_location | text | NOT NULL |
| status | varchar | 'draft' or 'submitted', default 'draft' |
| submitted_at | timestamptz | nullable |
| submitted_by | uuid | FK auth.users, nullable |
| created_by | uuid | FK auth.users, NOT NULL |
| total_d_sales | float8 | nullable summary |
| total_d_payout | float8 | nullable summary |
| shift_sales | float8 | nullable summary |
| shift_payout | float8 | nullable summary |
| activated | float8 | nullable summary |
| value_notes | text | nullable |
| total_drawer_sold | float8 | nullable summary |
| drawer_notes | text | nullable |

UNIQUE constraint on `(report_date, shift_type, store_location)`.

**Table `value_stock_entries`** (8 rows per report)
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | identity |
| report_id | bigint FK | -> shift_reports, ON DELETE CASCADE |
| amount_label | varchar | '$2','$3','$4','$5','$10','$20','$30','$50' |
| sort_order | int | 1-8 |
| start_count | float8 | default 0, auto-filled from previous shift |
| added | float8 | default 0 |
| sold | float8 | default 0 |
| end_count | float8 | default 0, = start + added - sold |
| end_count_override | float8 | nullable, manual override |
| has_mismatch | boolean | default false |

**Table `drawer_stock_entries`** (14 rows per report)
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | identity |
| report_id | bigint FK | -> shift_reports, ON DELETE CASCADE |
| drawer_number | int | 1-14 |
| contents | varchar | brand name |
| sort_order | int | 1-14 |
| opening | float8 | default 0, auto-filled from previous shift |
| addition | float8 | default 0 |
| sold | float8 | default 0 |
| closing | float8 | default 0, = opening + addition - sold |
| closing_override | float8 | nullable |
| has_mismatch | boolean | default false |

**Permissions:**
```sql
INSERT INTO role_permissions (role, resource, can_view, can_create, can_edit, can_delete) VALUES
  ('admin', 'shift_report', true, true, true, true),
  ('user', 'shift_report', true, true, true, false);
```

**RLS:** All authenticated users can SELECT all reports (for shift handoff visibility). INSERT/UPDATE allowed for all authenticated users. DELETE restricted to admins only.

---

## Hooks: `src/hooks/useShiftReports.ts`

Follow the pattern in `src/hooks/useProducts.ts` (useQuery with filters, useMutation with invalidation).

| Hook | Purpose |
|---|---|
| `useShiftReports(filters)` | Paginated list query for reports list page |
| `useShiftReport(id)` | Single report + entries (value_stock + drawer_stock) |
| `useCreateShiftReport()` | Create parent row, return ID |
| `useUpdateShiftReport()` | Update parent row (summary fields, notes, status) |
| `useSaveValueStockEntries(reportId)` | Upsert 8 value stock rows |
| `useSaveDrawerStockEntries(reportId)` | Upsert 14 drawer stock rows |
| `useSubmitShiftReport()` | Set status='submitted', submitted_at, submitted_by |
| `useDeleteShiftReport()` | Admin-only delete |
| `usePreviousShiftClosing(date, shift, store)` | Query previous shift's closing values for auto-fill |

**Previous shift logic:** `7-3` prev is `11-7` same day, `3-11` prev is `7-3` same day, `11-7` prev is `3-11` same day. Query the most recent submitted report matching the previous shift/store.

---

## Constants: `src/lib/shift-report-constants.ts`

Hardcoded definitions (no database table needed):

```ts
export const STORE_LOCATIONS = ['Store 1', 'Store 2', 'Store 3']; // Update with actual names

export const SHIFT_TYPES = ['7-3', '3-11', '11-7'] as const;

export const VALUE_STOCK_ROWS = [
  { label: '$2', sortOrder: 1 },
  { label: '$3', sortOrder: 2 },
  { label: '$4', sortOrder: 3 },
  { label: '$5', sortOrder: 4 },
  { label: '$10', sortOrder: 5 },
  { label: '$20', sortOrder: 6 },
  { label: '$30', sortOrder: 7 },
  { label: '$50', sortOrder: 8 },
];

export const DRAWER_STOCK_ROWS = [
  { drawer: 1, contents: 'DUMAURIER' },
  { drawer: 2, contents: 'BELMONT' },
  { drawer: 3, contents: 'NEXT' },
  { drawer: 4, contents: 'PALLMALL' },
  { drawer: 5, contents: 'CANADIAN CLASSIC' },
  { drawer: 6, contents: 'JOHN PLAYERS' },
  { drawer: 7, contents: 'PHILIP MORRIS' },
  { drawer: 8, contents: 'VICEROY / MATINEE / VOGUE' },
  { drawer: 9, contents: 'PLAYERS' },
  { drawer: 10, contents: 'EXPORT A / MCDONALD / MALBORO' },
  { drawer: 11, contents: 'JPP PLUS' },
  { drawer: 12, contents: 'B&H / DUNHILL / ROOFTOP' },
  { drawer: 13, contents: 'ROTHMANS / NO.7 / ACCORD' },
  { drawer: 14, contents: 'LD' },
];
```

---

## New Components: `src/components/shift-report/`

| Component | Purpose |
|---|---|
| `ShiftReportFormProvider.tsx` | React Context + useReducer for multi-step wizard state |
| `StepIndicator.tsx` | 3-step progress bar (Value Stock -> Drawer Stock -> Review) |
| `ReportHeader.tsx` | Shared header: date picker, shift incharge, shift selector, store dropdown, Save Draft/Submit buttons, status badge |
| `ValueStockTable.tsx` | Editable table with 8 denomination rows, auto-calc End Count, mismatch warnings |
| `ValueStockSummary.tsx` | Sticky side card with totals (D-Sales, D-Payout, Shift Sales, etc.) + notes textarea |
| `DrawerStockTable.tsx` | Editable table with 14 product rows, search/filter, auto-calc Closing |
| `ReviewSummary.tsx` | Read-only summary of both pages, mismatch highlights, print button, submit confirmation |

**Reuse existing:**
- `ConfirmModal` from `src/components/ui/Modal.tsx` for submit confirmation
- `useToast()` from `src/components/ui/Toast.tsx` for save/submit feedback
- `DataTable` from `src/components/ui/DataTable.tsx` for the reports list page
- Global CSS classes: `.card`, `.btn-primary`, `.btn-secondary`, `.input`, `.select`, `.label`, `.badge-*`

---

## State Management

React Context (`ShiftReportFormProvider`) wrapping `shift-report/new/layout.tsx`:

```ts
interface ShiftReportFormState {
  reportId: number | null;
  reportDate: string;
  shiftType: '7-3' | '3-11' | '11-7';
  shiftIncharge: string;
  storeLocation: string;
  status: 'draft' | 'submitted';
  valueStockEntries: ValueStockEntry[];   // 8 items
  drawerStockEntries: DrawerStockEntry[]; // 14 items
  summaryFields: { totalDSales, totalDPayout, shiftSales, shiftPayout, activated };
  valueNotes: string;
  drawerNotes: string;
  currentStep: 1 | 2 | 3;
  isDirty: boolean;
  lastSavedAt: string | null;
}
```

---

## UX Details

- **Validation colors:** green border = valid row, red border = mismatch, gray bg = auto-filled read-only
- **Sticky headers:** `sticky top-0 z-10 bg-white` on table headers
- **Large inputs:** `text-lg py-3` for touch-friendly numeric inputs
- **Side summary:** `sticky top-20` on desktop (right column), inline on mobile
- **Print:** Add `@media print` rules to `globals.css` to hide sidebar/nav/buttons, show clean report
- **Mobile:** Horizontal scroll on tables, stacked layout for header fields
- **Draft auto-save indicator:** "Last saved: X minutes ago" text near Save Draft button

---

## Implementation Order

### Phase 1: Database
1. Write migration SQL (3 tables + permissions)
2. Apply via Supabase MCP

### Phase 2: Data Layer
3. Create `src/lib/shift-report-constants.ts` (stores, denominations, drawer rows)
4. Create `src/hooks/useShiftReports.ts` with all hooks + TypeScript interfaces

### Phase 3: Shared Components
5. `ShiftReportFormProvider.tsx` (context + reducer)
6. `StepIndicator.tsx`
7. `ReportHeader.tsx`

### Phase 4: Wizard Pages
8. `shift-report/new/layout.tsx` (wraps provider + step indicator)
9. `ValueStockTable.tsx` + `ValueStockSummary.tsx`
10. `shift-report/new/value-stock/page.tsx` (Step 1)
11. `DrawerStockTable.tsx`
12. `shift-report/new/drawer-stock/page.tsx` (Step 2)
13. `ReviewSummary.tsx`
14. `shift-report/new/review/page.tsx` (Step 3)

### Phase 5: List & View Pages
15. `shift-report/page.tsx` (reports list with DataTable)
16. `shift-report/[id]/page.tsx` (view/edit existing report)

### Phase 6: Integration
17. Add nav item to `AppLayout.tsx`
18. Add `@media print` CSS to `globals.css`

---

## Verification

1. **Build check:** `npm run build` - ensure no TypeScript errors
2. **Type check:** `npm run typecheck`
3. **Lint:** `npm run lint`
4. **Manual test flow:**
   - Navigate to /shift-report -> see empty list
   - Click "New Report" -> wizard starts at Step 1
   - Fill header fields, enter Added/Sold values -> End Count auto-calculates
   - Click "Save Draft" -> toast confirms, data persists
   - Navigate to Step 2 -> fill drawer stock entries
   - Navigate to Step 3 -> review all data, see totals and mismatches
   - Submit -> confirmation modal -> report status changes to "submitted"
   - Return to list -> see the submitted report
   - Create new report for next shift -> verify Start Count/Opening auto-fills from previous
5. **Responsive:** Test on mobile viewport (375px) - tables scroll, inputs are touch-friendly
6. **Print:** Use browser print preview on Review page - clean layout without sidebar/nav

---
name: "Standalone Added Stock Page"
description: "Separate stock additions into a standalone page accessible anytime, auto-feeding into shift report calculations"
status: "completed"
completed_items:
  - "Phase 1: Database migration (stock_additions as standalone table with date/shift/store, role permissions)"
  - "Phase 2: ShiftReportFormProvider (removed stockAdditions state, added SET_VALUE_STOCK_ADDED and SET_DRAWER_STOCK_ADDED actions)"
  - "Phase 3: useStockAdditions hook (CRUD + aggregated query for shift reports)"
  - "Phase 4: Shift report wizard reverted to 3 steps, auto-fetches additions via useStockAdditionsForShift"
  - "Phase 5: Standalone /added-stock page with date/shift/store filters and inline add/delete"
  - "Phase 6: AppLayout navigation (PackagePlus icon, added_stock resource)"
notes:
  went_well:
    - "TypeScript typecheck passed with zero errors"
    - "Production build succeeded (23 pages)"
    - "Both migrations applied cleanly"
  went_wrong: []
  blockers: []
---

# Standalone Added Stock Page

## Summary

Stock additions are now a standalone feature, separate from the shift report wizard.

### How it works:
1. Users go to **Added Stock** page from the sidebar (available anytime)
2. Select date, shift (7-3/3-11/11-7), and store
3. Add stock entries (value stock denominations or drawer stock items) with quantity and optional notes
4. Each addition saves immediately to the database
5. When creating/editing a shift report, the value stock and drawer stock pages automatically fetch additions for that date/shift/store and apply them to the `added`/`addition` fields
6. End count = start + added - sold (where `added` is computed from standalone additions)

### Data model:
`stock_additions` table: id, addition_date, shift_type, store_location, stock_type, item_key, quantity, notes, created_by

### Shift report integration:
- `useStockAdditionsForShift(date, shift, store)` returns aggregated `{ valueAdded, drawerAdded }` maps
- Value stock page dispatches `SET_VALUE_STOCK_ADDED` with the aggregated values
- Drawer stock page dispatches `SET_DRAWER_STOCK_ADDED` with the aggregated values
- Formulas: `end_count = start_count + added - sold`, `closing = opening + addition - sold`

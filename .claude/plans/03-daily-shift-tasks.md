---
name: "Daily Shift Tasks"
description: "End-to-end daily task management with photo proof uploads and admin verification for store employees across shifts"
status: "completed"
completed_items:
  - "Phase 1: Database migration (task_templates, task_completions, RLS, storage bucket, role permissions)"
  - "Phase 2: Constants file + hooks (useImageUpload, useTaskTemplates, useTaskCompletions)"
  - "Phase 3: Components (ImageUploadArea, ImagePreviewModal, TaskTemplateForm, TaskStatsCards, TaskCard, TaskCompletionModal, TaskReviewCard, RejectTaskModal)"
  - "Phase 4: Admin pages (landing, templates CRUD, review/verify)"
  - "Phase 5: Employee page (my-tasks with completion flow)"
  - "Phase 6: Navigation (AppLayout updated with ClipboardCheck icon)"
notes:
  went_well:
    - "All TypeScript types passed with zero errors"
    - "Production build succeeded"
    - "Migration applied cleanly"
  went_wrong: []
  blockers: []
---

# Daily Shift Tasks

## Context

The store operates with 2 shifts (morning/evening) across 3 store locations. Each day (Mon-Sun) has specific tasks employees must complete. Employees upload a photo as proof, and admins verify whether the task was done. This plan adds full task template management (admin), task completion with photo upload (employee), and a review/verification workflow (admin).

### Key Design Decisions
- **2 shifts:** morning and evening (independent from the 3-shift system in shift-reports)
- **Per-store templates:** Each store can have different task lists
- **First-to-complete claims it:** All employees on a shift see all tasks; completing one claims it
- **Employee sees today only:** No history view for employees; admins can review all dates
- **On-demand completions:** No cron/auto-generation. Templates define what's needed; completion rows created when employee submits

---

## Phase 1: Database Migration

Apply a single migration via `mcp__supabase__apply_migration`.

### Table: `task_templates`

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | GENERATED ALWAYS AS IDENTITY |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |
| task_name | text NOT NULL | e.g. "Clean restrooms" |
| description | text | Detailed instructions (nullable) |
| day_of_week | int NOT NULL | 0=Sunday ... 6=Saturday (JS convention) |
| shift_type | varchar NOT NULL | CHECK IN ('morning', 'evening') |
| store_location | varchar NOT NULL | CHECK IN ('Store 1', 'Store 2', 'Store 3') |
| is_active | boolean | DEFAULT true (soft-delete) |
| sort_order | int | DEFAULT 0 |
| created_by | uuid NOT NULL | FK auth.users |

Index: `(day_of_week, shift_type, store_location) WHERE is_active = true`

### Table: `task_completions`

| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | GENERATED ALWAYS AS IDENTITY |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |
| template_id | bigint NOT NULL | FK task_templates ON DELETE CASCADE |
| task_date | date NOT NULL | The date the task was done |
| completed_by | uuid NOT NULL | FK auth.users |
| completed_at | timestamptz | DEFAULT now() |
| image_url | text NOT NULL | Supabase storage path |
| notes | text | Employee notes (nullable) |
| verification_status | varchar | DEFAULT 'pending', CHECK IN ('pending', 'approved', 'rejected') |
| verified_by | uuid | FK auth.users (nullable) |
| verified_at | timestamptz | nullable |
| admin_notes | text | Rejection reason (nullable) |

UNIQUE: `(template_id, task_date)` — one completion per task per day (first to complete claims it)
Indexes: `(task_date, verification_status)`, `(completed_by, task_date)`

### RLS Policies
- **task_templates:** SELECT for all authenticated; INSERT/UPDATE/DELETE for admin only
- **task_completions:** SELECT for all authenticated; INSERT for all authenticated; UPDATE for admin OR the completing user when status='pending'; DELETE for admin only

### Storage Policies
- Create policies on `storage.objects` for `task-proofs/` path in the `store` bucket
- Authenticated users can upload (INSERT) and view (SELECT)
- Admin can delete

### Role Permissions
```sql
INSERT INTO role_permissions (role, resource, can_view, can_create, can_edit, can_delete) VALUES
  ('admin', 'daily_tasks', true, true, true, true),
  ('user',  'daily_tasks', true, true, true, false);
```

---

## Phase 2: Constants + Hooks

### New: `src/lib/daily-tasks-constants.ts`
- `TASK_SHIFT_TYPES`: `['morning', 'evening']`
- `DAYS_OF_WEEK`: array of `{ value: 0-6, label: 'Sunday'-'Saturday' }`
- `VERIFICATION_STATUSES`: `[{ value, label, badge }]` for pending/approved/rejected
- `MAX_IMAGE_SIZE_MB = 5`, `ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']`
- Reuse `STORE_LOCATIONS` from `src/lib/shift-report-constants.ts`

### New: `src/hooks/useImageUpload.ts`
- `useImageUpload()` — returns `{ uploadImage, isUploading, error }`
- Validates file size and MIME type
- Uploads to `store` bucket under `task-proofs/{userId}_{timestamp}_{filename}`
- Returns the public URL
- Pattern: standalone utility hook, no React Query needed

### New: `src/hooks/useTaskTemplates.ts`
Follow `useTodos.ts` pattern exactly:
- `useTaskTemplates(filters)` — paginated list with search, day_of_week, shift_type, store_location, is_active filters
- `useTaskTemplatesForDay(dayOfWeek, shiftType, storeLocation)` — active templates for a specific day/shift/store (employee view)
- `useCreateTaskTemplate()` — insert mutation, invalidates `['task-templates']`
- `useUpdateTaskTemplate()` — update mutation
- `useDeleteTaskTemplate()` — soft-delete (set is_active=false)

### New: `src/hooks/useTaskCompletions.ts`
- `useTaskCompletions(filters)` — paginated list with task_date, verification_status, store, search. Joins `task_templates` for task_name and `user_profiles` for employee name
- `useTodayCompletions(date, shiftType, storeLocation)` — all completions for a date/shift/store combo (to show claimed tasks to all employees)
- `useCreateTaskCompletion()` — insert completion after image upload
- `useUpdateTaskCompletion()` — for re-upload on rejection
- `useVerifyTask()` — admin mutation: sets verification_status, verified_by, verified_at, admin_notes
- `useTodayTaskStats()` — aggregate counts for admin dashboard cards

---

## Phase 3: Components

All in `src/components/daily-tasks/`:

| Component | Purpose |
|-----------|---------|
| `ImageUploadArea.tsx` | Drag-and-drop + click-to-upload with preview, size validation, loading state |
| `ImagePreviewModal.tsx` | Full-size image viewer modal (wraps `Modal` from `ui/Modal.tsx`) |
| `TaskTemplateForm.tsx` | Form for create/edit template: task_name, description, day_of_week, shift_type, store_location, sort_order, is_active. Uses React Hook Form + Zod |
| `TaskCard.tsx` | Employee-facing card: task name, description, status badge, "Complete" or "Re-submit" button |
| `TaskCompletionModal.tsx` | Employee modal: shows task info, ImageUploadArea, notes textarea, submit button |
| `TaskReviewCard.tsx` | Admin card: task info, employee name, image thumbnail (clickable), approve/reject buttons |
| `RejectTaskModal.tsx` | Small modal for admin to enter rejection notes |
| `TaskStatsCards.tsx` | KPI cards: total tasks today, completed, pending review, approved, rejected |

---

## Phase 4: Admin Pages

### `src/app/(app)/daily-tasks/page.tsx` — Landing Page
- Check `useUserRole()`:
  - **Admin:** Dashboard with `TaskStatsCards` + navigation cards to "Manage Templates" and "Review Tasks"
  - **User:** Render the "My Tasks" view inline (or redirect to `/daily-tasks/my-tasks`)

### `src/app/(app)/daily-tasks/templates/page.tsx` — Template Management
- Guard: `useRequireAdmin()`
- Pattern: follows `users/page.tsx`
- `DataTable` with columns: Task Name, Day, Shift, Store, Active, Sort Order
- Filters: day_of_week dropdown, shift_type dropdown, store dropdown
- Add/Edit Modal with `TaskTemplateForm`
- Bulk view: admin can see all templates at a glance, filter by day/shift/store

### `src/app/(app)/daily-tasks/review/page.tsx` — Task Review
- Guard: `useRequireAdmin()`
- Filters card: date picker (default today), shift_type, store, verification_status, search
- Card grid layout (not DataTable, since each card shows an image):
  - `TaskReviewCard` for each completion
  - Thumbnail of proof photo, clickable to open `ImagePreviewModal`
  - Approve (green) / Reject (red) buttons
  - Reject opens `RejectTaskModal` for admin notes

---

## Phase 5: Employee Page

### `src/app/(app)/daily-tasks/my-tasks/page.tsx` — Today's Tasks
- Header: today's date, shift selector (morning/evening), store selector
- Fetches templates via `useTaskTemplatesForDay(dayOfWeek, shift, store)`
- Fetches completions via `useTodayCompletions(today, shift, store)` — all completions for this day/shift/store to show claimed tasks
- Merges: for each template, find matching completion
- Renders `TaskCard` for each:
  - **Not done (no completion):** gray, "Complete Task" button -> opens `TaskCompletionModal`
  - **Claimed by another user:** gray with "Completed by [name]" text, no action
  - **Submitted by current user, pending:** orange badge, shows thumbnail
  - **Approved:** green checkmark, read-only
  - **Rejected:** red badge, "Re-submit" button -> opens `TaskCompletionModal` pre-filled

### Task Completion Flow
1. Employee clicks "Complete Task" on a `TaskCard`
2. `TaskCompletionModal` opens with task name/description
3. Employee selects/drops image -> `ImageUploadArea` shows preview
4. Employee optionally adds notes
5. Submit: `useImageUpload` uploads to storage -> gets URL -> `useCreateTaskCompletion` inserts row
6. Card updates to show "Pending Review" status

### Re-submission Flow (on rejection)
1. Employee clicks "Re-submit" on rejected task
2. `TaskCompletionModal` opens with existing notes
3. Upload new image -> `useImageUpload` uploads -> `useUpdateTaskCompletion` updates row (new image_url, status back to 'pending', clear admin_notes)

---

## Phase 6: Navigation

### Modify: `src/components/AppLayout.tsx`
- Add `ClipboardCheck` to lucide-react imports
- Add nav item: `{ path: '/daily-tasks', label: 'Daily Tasks', icon: ClipboardCheck, resource: 'daily_tasks' }`
- Position after "Cash Counting", before "Todos"

---

## File Manifest

### New Files (16)

| # | Path | Purpose |
|---|------|---------|
| 1 | `src/lib/daily-tasks-constants.ts` | Constants: shifts, days, statuses, image limits |
| 2 | `src/hooks/useImageUpload.ts` | Supabase Storage upload hook |
| 3 | `src/hooks/useTaskTemplates.ts` | Template CRUD hooks |
| 4 | `src/hooks/useTaskCompletions.ts` | Completion CRUD + verification hooks |
| 5 | `src/app/(app)/daily-tasks/page.tsx` | Landing page (admin dashboard / employee tasks) |
| 6 | `src/app/(app)/daily-tasks/templates/page.tsx` | Admin: template CRUD |
| 7 | `src/app/(app)/daily-tasks/my-tasks/page.tsx` | Employee: today's task checklist |
| 8 | `src/app/(app)/daily-tasks/review/page.tsx` | Admin: review/verify completions |
| 9 | `src/components/daily-tasks/TaskCard.tsx` | Employee task card |
| 10 | `src/components/daily-tasks/TaskCompletionModal.tsx` | Photo upload + completion modal |
| 11 | `src/components/daily-tasks/ImageUploadArea.tsx` | Drag-and-drop image upload |
| 12 | `src/components/daily-tasks/ImagePreviewModal.tsx` | Full-size image viewer |
| 13 | `src/components/daily-tasks/TaskReviewCard.tsx` | Admin review card |
| 14 | `src/components/daily-tasks/RejectTaskModal.tsx` | Rejection notes modal |
| 15 | `src/components/daily-tasks/TaskStatsCards.tsx` | KPI summary cards |
| 16 | `src/components/daily-tasks/TaskTemplateForm.tsx` | Template form (RHF + Zod) |

### Modified Files (1)

| # | Path | Change |
|---|------|--------|
| 1 | `src/components/AppLayout.tsx` | Add ClipboardCheck icon import + daily_tasks nav item |

---

## Implementation Order

1. Database migration (tables, RLS, storage policies, role permissions)
2. Constants file
3. Hooks: useImageUpload -> useTaskTemplates -> useTaskCompletions
4. Shared components: ImageUploadArea, ImagePreviewModal, TaskTemplateForm, TaskStatsCards
5. Admin pages: templates/page.tsx, RejectTaskModal, TaskReviewCard, review/page.tsx
6. Employee components: TaskCard, TaskCompletionModal
7. Employee page: my-tasks/page.tsx
8. Landing page: daily-tasks/page.tsx
9. Navigation: update AppLayout.tsx

---

## Verification

1. `npm run typecheck` — no type errors
2. `npm run lint` — no lint issues
3. `npm run build` — successful production build
4. Manual testing:
   - Admin: create templates for Monday morning/evening at Store 1
   - Admin: create templates for different stores to verify per-store isolation
   - Employee: log in, go to Daily Tasks, select shift + store, see today's tasks
   - Employee: complete a task with photo upload, verify it shows as "Pending"
   - Another employee: verify the claimed task shows "Completed by [name]"
   - Admin: go to Review, see submitted task with photo, approve it
   - Admin: reject another task with notes
   - Employee: see rejected task, re-submit with new photo
   - Verify RLS: employee cannot delete templates or others' completions

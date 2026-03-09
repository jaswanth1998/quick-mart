'use client';

import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import { VALUE_STOCK_ROWS, DRAWER_STOCK_ROWS, type ShiftType } from '@/lib/shift-report-constants';

// ---------------------------------------------------------------------------
// State interfaces
// ---------------------------------------------------------------------------

export interface ValueStockEntryState {
  amount_label: string;
  sort_order: number;
  start_count: number;
  added: number;
  sold: number;
  end_count: number;
  end_count_override: number | null;
  has_mismatch: boolean;
}

export interface DrawerStockEntryState {
  drawer_number: number;
  contents: string;
  sort_order: number;
  opening: number;
  addition: number;
  sold: number;
  closing: number;
  closing_override: number | null;
  has_mismatch: boolean;
}

export interface ShiftReportFormState {
  reportId: number | null;
  reportDate: string;
  shiftType: ShiftType;
  shiftIncharge: string;
  storeLocation: string;
  status: 'draft' | 'submitted';
  valueStockEntries: ValueStockEntryState[];
  drawerStockEntries: DrawerStockEntryState[];
  totalDSales: number;
  totalDPayout: number;
  shiftSales: number;
  shiftPayout: number;
  activated: number;
  valueNotes: string;
  drawerNotes: string;
  currentStep: 1 | 2 | 3;
  isDirty: boolean;
  lastSavedAt: string | null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type ShiftReportAction =
  | { type: 'SET_HEADER'; payload: Partial<Pick<ShiftReportFormState, 'reportDate' | 'shiftType' | 'shiftIncharge' | 'storeLocation'>> }
  | { type: 'SET_VALUE_STOCK_ENTRY'; payload: { index: number; field: 'added' | 'sold' | 'end_count_override'; value: number | null } }
  | { type: 'SET_VALUE_STOCK_START_COUNTS'; payload: Record<string, number> }
  | { type: 'SET_DRAWER_STOCK_ENTRY'; payload: { index: number; field: 'addition' | 'sold' | 'closing_override'; value: number | null } }
  | { type: 'SET_DRAWER_STOCK_OPENINGS'; payload: Record<string, number> }
  | { type: 'SET_SUMMARY_FIELD'; payload: { field: 'totalDSales' | 'totalDPayout' | 'shiftSales' | 'shiftPayout' | 'activated'; value: number } }
  | { type: 'SET_VALUE_NOTES'; payload: string }
  | { type: 'SET_DRAWER_NOTES'; payload: string }
  | { type: 'SET_STEP'; payload: 1 | 2 | 3 }
  | { type: 'SET_REPORT_ID'; payload: number }
  | { type: 'SET_STATUS'; payload: 'draft' | 'submitted' }
  | { type: 'SET_SAVED'; payload: string }
  | { type: 'LOAD_REPORT'; payload: ShiftReportFormState }
  | { type: 'RESET' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialValueStockEntries(): ValueStockEntryState[] {
  return VALUE_STOCK_ROWS.map((row) => ({
    amount_label: row.label,
    sort_order: row.sortOrder,
    start_count: 0,
    added: 0,
    sold: 0,
    end_count: 0,
    end_count_override: null,
    has_mismatch: false,
  }));
}

function buildInitialDrawerStockEntries(): DrawerStockEntryState[] {
  return DRAWER_STOCK_ROWS.map((row) => ({
    drawer_number: row.drawer,
    contents: row.contents,
    sort_order: row.drawer,
    opening: 0,
    addition: 0,
    sold: 0,
    closing: 0,
    closing_override: null,
    has_mismatch: false,
  }));
}

function recalcValueEntry(entry: ValueStockEntryState): ValueStockEntryState {
  const end_count = entry.start_count + entry.added - entry.sold;
  const has_mismatch =
    entry.end_count_override !== null && entry.end_count_override !== end_count;
  return { ...entry, end_count, has_mismatch };
}

function recalcDrawerEntry(entry: DrawerStockEntryState): DrawerStockEntryState {
  const closing = entry.opening + entry.addition - entry.sold;
  const has_mismatch =
    entry.closing_override !== null && entry.closing_override !== closing;
  return { ...entry, closing, has_mismatch };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: ShiftReportFormState = {
  reportId: null,
  reportDate: new Date().toISOString().split('T')[0],
  shiftType: '7-3',
  shiftIncharge: '',
  storeLocation: '4403 Kingston',
  status: 'draft',
  valueStockEntries: buildInitialValueStockEntries(),
  drawerStockEntries: buildInitialDrawerStockEntries(),
  totalDSales: 0,
  totalDPayout: 0,
  shiftSales: 0,
  shiftPayout: 0,
  activated: 0,
  valueNotes: '',
  drawerNotes: '',
  currentStep: 1,
  isDirty: false,
  lastSavedAt: null,
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function reducer(state: ShiftReportFormState, action: ShiftReportAction): ShiftReportFormState {
  switch (action.type) {
    case 'SET_HEADER':
      return { ...state, ...action.payload, isDirty: true };

    case 'SET_VALUE_STOCK_ENTRY': {
      const { index, field, value } = action.payload;
      const entries = state.valueStockEntries.map((entry, i) => {
        if (i !== index) return entry;
        const updated = { ...entry, [field]: value };
        return recalcValueEntry(updated);
      });
      return { ...state, valueStockEntries: entries, isDirty: true };
    }

    case 'SET_VALUE_STOCK_START_COUNTS': {
      const entries = state.valueStockEntries.map((entry) => {
        const count = action.payload[entry.amount_label];
        if (count === undefined) return entry;
        const updated = { ...entry, start_count: count };
        return recalcValueEntry(updated);
      });
      return { ...state, valueStockEntries: entries, isDirty: true };
    }

    case 'SET_DRAWER_STOCK_ENTRY': {
      const { index, field, value } = action.payload;
      const entries = state.drawerStockEntries.map((entry, i) => {
        if (i !== index) return entry;
        const updated = { ...entry, [field]: value };
        return recalcDrawerEntry(updated);
      });
      return { ...state, drawerStockEntries: entries, isDirty: true };
    }

    case 'SET_DRAWER_STOCK_OPENINGS': {
      const entries = state.drawerStockEntries.map((entry) => {
        const count = action.payload[entry.contents];
        if (count === undefined) return entry;
        const updated = { ...entry, opening: count };
        return recalcDrawerEntry(updated);
      });
      return { ...state, drawerStockEntries: entries, isDirty: true };
    }

    case 'SET_SUMMARY_FIELD':
      return { ...state, [action.payload.field]: action.payload.value, isDirty: true };

    case 'SET_VALUE_NOTES':
      return { ...state, valueNotes: action.payload, isDirty: true };

    case 'SET_DRAWER_NOTES':
      return { ...state, drawerNotes: action.payload, isDirty: true };

    case 'SET_STEP':
      return { ...state, currentStep: action.payload };

    case 'SET_REPORT_ID':
      return { ...state, reportId: action.payload };

    case 'SET_STATUS':
      return { ...state, status: action.payload, isDirty: true };

    case 'SET_SAVED':
      return { ...state, lastSavedAt: action.payload, isDirty: false };

    case 'LOAD_REPORT':
      return { ...action.payload };

    case 'RESET':
      return { ...initialState, valueStockEntries: buildInitialValueStockEntries(), drawerStockEntries: buildInitialDrawerStockEntries() };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context & Provider
// ---------------------------------------------------------------------------

const ShiftReportFormContext = createContext<{
  state: ShiftReportFormState;
  dispatch: Dispatch<ShiftReportAction>;
} | null>(null);

export function useShiftReportForm() {
  const ctx = useContext(ShiftReportFormContext);
  if (!ctx) throw new Error('useShiftReportForm must be used within ShiftReportFormProvider');
  return ctx;
}

export function ShiftReportFormProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <ShiftReportFormContext.Provider value={{ state, dispatch }}>
      {children}
    </ShiftReportFormContext.Provider>
  );
}

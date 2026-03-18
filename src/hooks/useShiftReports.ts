import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { ShiftType, getPreviousShift } from '@/lib/shift-report-constants';

export interface ShiftReport {
  id: number;
  created_at: string;
  updated_at: string;
  report_date: string;
  shift_type: ShiftType;
  shift_incharge: string;
  store_location: string;
  status: 'draft' | 'submitted';
  submitted_at: string | null;
  submitted_by: string | null;
  created_by: string;
  verification_status: 'pending' | 'verified' | 'flagged';
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  total_d_sales: number | null;
  total_d_payout: number | null;
  shift_sales: number | null;
  shift_payout: number | null;
  activated: number | null;
  value_notes: string | null;
  total_drawer_sold: number | null;
  drawer_notes: string | null;
}

export interface ValueStockEntry {
  id?: number;
  report_id?: number;
  amount_label: string;
  sort_order: number;
  start_count: number;
  added: number;
  subtracted: number;
  sold: number;
  end_count: number;
  end_count_override: number | null;
  has_mismatch: boolean;
}

export interface DrawerStockEntry {
  id?: number;
  report_id?: number;
  drawer_number: number;
  contents: string;
  sort_order: number;
  opening: number;
  addition: number;
  subtraction: number;
  sold: number;
  closing: number;
  closing_override: number | null;
  has_mismatch: boolean;
}

export interface ShiftReportWithEntries extends ShiftReport {
  value_stock_entries: ValueStockEntry[];
  drawer_stock_entries: DrawerStockEntry[];
}

export interface ShiftReportsFilter {
  search?: string;
  status?: 'draft' | 'submitted';
  verificationStatus?: 'pending' | 'verified' | 'flagged';
  shiftType?: ShiftType;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ShiftReportsResponse {
  data: ShiftReport[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const useShiftReports = (filters: ShiftReportsFilter = {}) => {
  const {
    search = '',
    status,
    verificationStatus,
    shiftType,
    startDate,
    endDate,
    page = 1,
    pageSize = 10,
  } = filters;

  return useQuery({
    queryKey: ['shift-reports', { search, status, verificationStatus, shiftType, startDate, endDate, page, pageSize }],
    queryFn: async (): Promise<ShiftReportsResponse> => {
      const supabase = createClient();

      let query = supabase
        .from('shift_reports')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`shift_incharge.ilike.%${search}%,store_location.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (verificationStatus) {
        query = query.eq('verification_status', verificationStatus);
      }

      if (shiftType) {
        query = query.eq('shift_type', shiftType);
      }

      if (startDate) {
        query = query.gte('report_date', startDate);
      }
      if (endDate) {
        query = query.lte('report_date', endDate);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      query = query.order('report_date', { ascending: false }).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: data || [],
        total,
        page,
        pageSize,
        totalPages,
      };
    },
  });
};

export const useShiftReport = (id: number | null | undefined) => {
  return useQuery({
    queryKey: ['shift-report', id],
    queryFn: async (): Promise<ShiftReportWithEntries> => {
      const supabase = createClient();

      const { data: report, error: reportError } = await supabase
        .from('shift_reports')
        .select('*')
        .eq('id', id!)
        .single();

      if (reportError) {
        throw new Error(reportError.message);
      }

      const { data: valueEntries, error: valueError } = await supabase
        .from('value_stock_entries')
        .select('*')
        .eq('report_id', id!)
        .order('sort_order', { ascending: true });

      if (valueError) {
        throw new Error(valueError.message);
      }

      const { data: drawerEntries, error: drawerError } = await supabase
        .from('drawer_stock_entries')
        .select('*')
        .eq('report_id', id!)
        .order('sort_order', { ascending: true });

      if (drawerError) {
        throw new Error(drawerError.message);
      }

      return {
        ...report,
        value_stock_entries: valueEntries || [],
        drawer_stock_entries: drawerEntries || [],
      };
    },
    enabled: !!id,
  });
};

export const useCreateShiftReport = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (report: Pick<ShiftReport, 'report_date' | 'shift_type' | 'shift_incharge' | 'store_location' | 'status' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('shift_reports')
        .insert([report])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-reports'] });
    },
  });
};

export const useUpdateShiftReport = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ShiftReport> & { id: number }) => {
      const { data, error } = await supabase
        .from('shift_reports')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift-reports'] });
      queryClient.invalidateQueries({ queryKey: ['shift-report', variables.id] });
    },
  });
};

export const useSaveValueStockEntries = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      entries,
    }: {
      reportId: number;
      entries: Omit<ValueStockEntry, 'id' | 'report_id'>[];
    }) => {
      const { error: deleteError } = await supabase
        .from('value_stock_entries')
        .delete()
        .eq('report_id', reportId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      const entriesWithReportId = entries.map((entry) => ({
        ...entry,
        report_id: reportId,
      }));

      const { data, error: insertError } = await supabase
        .from('value_stock_entries')
        .insert(entriesWithReportId)
        .select();

      if (insertError) {
        throw new Error(insertError.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift-report', variables.reportId] });
    },
  });
};

export const useSaveDrawerStockEntries = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      entries,
    }: {
      reportId: number;
      entries: Omit<DrawerStockEntry, 'id' | 'report_id'>[];
    }) => {
      const { error: deleteError } = await supabase
        .from('drawer_stock_entries')
        .delete()
        .eq('report_id', reportId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      const entriesWithReportId = entries.map((entry) => ({
        ...entry,
        report_id: reportId,
      }));

      const { data, error: insertError } = await supabase
        .from('drawer_stock_entries')
        .insert(entriesWithReportId)
        .select();

      if (insertError) {
        throw new Error(insertError.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift-report', variables.reportId] });
    },
  });
};

export const useSubmitShiftReport = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: number; userId: string }) => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('shift_reports')
        .update({
          status: 'submitted',
          submitted_at: now,
          submitted_by: userId,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift-reports'] });
      queryClient.invalidateQueries({ queryKey: ['shift-report', variables.id] });
    },
  });
};

export const useDeleteShiftReport = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('shift_reports')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-reports'] });
    },
  });
};

export const usePreviousShiftClosing = (
  reportDate: string | null | undefined,
  shiftType: ShiftType | null | undefined,
  storeLocation: string | null | undefined
) => {
  return useQuery({
    queryKey: ['previous-shift-closing', reportDate, shiftType, storeLocation],
    queryFn: async (): Promise<{
      valueStockClosing: Record<string, number>;
      drawerStockClosing: Record<string, number>;
    } | null> => {
      const supabase = createClient();

      const prevShift = getPreviousShift(shiftType!);

      const { data: storeMatch } = await supabase
        .from('shift_reports')
        .select('*')
        .eq('status', 'submitted')
        .eq('shift_type', prevShift.shiftType)
        .eq('store_location', storeLocation!)
        .lte('report_date', reportDate!)
        .order('report_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      let prevReport = storeMatch;

      if (!prevReport) {
        const { data: fallbackMatch } = await supabase
          .from('shift_reports')
          .select('*')
          .eq('status', 'submitted')
          .eq('shift_type', prevShift.shiftType)
          .lte('report_date', reportDate!)
          .order('report_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        prevReport = fallbackMatch;
      }

      if (!prevReport) {
        const { data: anyShiftMatch } = await supabase
          .from('shift_reports')
          .select('*')
          .eq('status', 'submitted')
          .eq('store_location', storeLocation!)
          .lte('report_date', reportDate!)
          .order('report_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        prevReport = anyShiftMatch;
      }

      if (!prevReport) {
        const { data: anyMatch } = await supabase
          .from('shift_reports')
          .select('*')
          .eq('status', 'submitted')
          .lte('report_date', reportDate!)
          .order('report_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        prevReport = anyMatch;
      }

      if (!prevReport) {
        return null;
      }

      const { data: valueEntries, error: valueError } = await supabase
        .from('value_stock_entries')
        .select('*')
        .eq('report_id', prevReport.id)
        .order('sort_order', { ascending: true });

      if (valueError) {
        throw new Error(valueError.message);
      }

      const { data: drawerEntries, error: drawerError } = await supabase
        .from('drawer_stock_entries')
        .select('*')
        .eq('report_id', prevReport.id)
        .order('sort_order', { ascending: true });

      if (drawerError) {
        throw new Error(drawerError.message);
      }

      const valueStockClosing: Record<string, number> = {};
      if (valueEntries) {
        for (const entry of valueEntries) {
          valueStockClosing[entry.amount_label] = entry.end_count_override ?? entry.end_count;
        }
      }

      const drawerStockClosing: Record<string, number> = {};
      if (drawerEntries) {
        for (const entry of drawerEntries) {
          drawerStockClosing[entry.contents] = entry.closing_override ?? entry.closing;
        }
      }

      return {
        valueStockClosing,
        drawerStockClosing,
      };
    },
    enabled: !!reportDate && !!shiftType && !!storeLocation,
  });
};

export const useVerifyShiftReport = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      verification_status,
      verification_notes,
    }: {
      id: number;
      verification_status: 'verified' | 'flagged';
      verification_notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('shift_reports')
        .update({
          verification_status,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          verification_notes: verification_notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shift-reports'] });
      queryClient.invalidateQueries({ queryKey: ['shift-report', variables.id] });
    },
  });
};

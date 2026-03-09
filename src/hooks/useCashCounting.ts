import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { CashCountingEntry, calculateStats, calculateDenominationBreakdown } from '@/lib/cash-counting-utils';

export interface CashCountingFilters {
  search?: string;
  status?: 'draft' | 'submitted';
  shiftType?: string;
  storeLocation?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface CashCountingResponse {
  data: CashCountingEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CashCountingAnalytics {
  stats: ReturnType<typeof calculateStats>;
  breakdown: ReturnType<typeof calculateDenominationBreakdown>;
  trends: {
    date: string;
    totalAmount: number;
    saleDrop: number;
    remaining: number;
  }[];
  shiftAnalysis: {
    shiftType: string;
    count: number;
    avgTotalAmount: number;
    avgRemaining: number;
  }[];
}

/**
 * Fetch paginated cash counting entries with filters
 */
export const useCashCountingEntries = (filters: CashCountingFilters = {}) => {
  const {
    search = '',
    status,
    shiftType,
    storeLocation,
    startDate,
    endDate,
    page = 1,
    pageSize = 10,
  } = filters;

  return useQuery({
    queryKey: ['cash-counting-entries', { search, status, shiftType, storeLocation, startDate, endDate, page, pageSize }],
    queryFn: async (): Promise<CashCountingResponse> => {
      const supabase = createClient();

      // Build the query
      let query = supabase
        .from('cash_counting_entries')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (search) {
        query = query.or(`shift_incharge.ilike.%${search}%,store_location.ilike.%${search}%`);
      }

      // Apply status filter
      if (status) {
        query = query.eq('status', status);
      }

      // Apply shift type filter
      if (shiftType) {
        query = query.eq('shift_type', shiftType);
      }

      // Apply store location filter
      if (storeLocation) {
        query = query.eq('store_location', storeLocation);
      }

      // Apply date range filter
      if (startDate) {
        query = query.gte('entry_date', startDate);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Order by entry_date descending, then created_at descending
      query = query.order('entry_date', { ascending: false }).order('created_at', { ascending: false });

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

/**
 * Fetch all entries in date range for analytics
 */
export const useCashCountingAnalytics = (
  filters: Pick<CashCountingFilters, 'startDate' | 'endDate' | 'shiftType' | 'storeLocation'> = {},
  options: { enabled?: boolean } = {}
) => {
  const { startDate, endDate, shiftType, storeLocation } = filters;

  return useQuery({
    queryKey: ['cash-counting-analytics', { startDate, endDate, shiftType, storeLocation }],
    enabled: options.enabled !== false,
    queryFn: async (): Promise<CashCountingAnalytics> => {
      const supabase = createClient();

      // Build query to fetch all entries in range
      let query = supabase
        .from('cash_counting_entries')
        .select('*')
        .eq('status', 'submitted'); // Only analyze submitted entries

      // Apply filters
      if (shiftType) {
        query = query.eq('shift_type', shiftType);
      }
      if (storeLocation) {
        query = query.eq('store_location', storeLocation);
      }
      if (startDate) {
        query = query.gte('entry_date', startDate);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      // Order by date
      query = query.order('entry_date', { ascending: true });

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const entries = data || [];

      // Calculate stats
      const stats = calculateStats(entries);

      // Calculate denomination breakdown
      const breakdown = calculateDenominationBreakdown(entries);

      // Calculate trends (group by date)
      const trendMap = new Map<string, { totalAmount: number; saleDrop: number; remaining: number; count: number }>();
      for (const entry of entries) {
        const existing = trendMap.get(entry.entry_date) || { totalAmount: 0, saleDrop: 0, remaining: 0, count: 0 };
        trendMap.set(entry.entry_date, {
          totalAmount: existing.totalAmount + entry.total_amount,
          saleDrop: existing.saleDrop + entry.sale_drop,
          remaining: existing.remaining + entry.remaining,
          count: existing.count + 1,
        });
      }

      const trends = Array.from(trendMap.entries())
        .map(([date, values]) => ({
          date,
          totalAmount: Math.round(values.totalAmount * 100) / 100,
          saleDrop: Math.round(values.saleDrop * 100) / 100,
          remaining: Math.round(values.remaining * 100) / 100,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate shift analysis
      const shiftMap = new Map<string, { totalAmount: number; remaining: number; count: number }>();
      for (const entry of entries) {
        const existing = shiftMap.get(entry.shift_type) || { totalAmount: 0, remaining: 0, count: 0 };
        shiftMap.set(entry.shift_type, {
          totalAmount: existing.totalAmount + entry.total_amount,
          remaining: existing.remaining + entry.remaining,
          count: existing.count + 1,
        });
      }

      const shiftAnalysis = Array.from(shiftMap.entries())
        .map(([shiftType, values]) => ({
          shiftType,
          count: values.count,
          avgTotalAmount: Math.round((values.totalAmount / values.count) * 100) / 100,
          avgRemaining: Math.round((values.remaining / values.count) * 100) / 100,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        stats,
        breakdown,
        trends,
        shiftAnalysis,
      };
    },
  });
};

/**
 * Create a new cash counting entry
 */
export const useCreateCashCountingEntry = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (entry: Omit<CashCountingEntry, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('cash_counting_entries')
        .insert([entry])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-counting-entries'] });
      queryClient.invalidateQueries({ queryKey: ['cash-counting-analytics'] });
    },
  });
};

/**
 * Update an existing cash counting entry
 */
export const useUpdateCashCountingEntry = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<CashCountingEntry> & { id: number }) => {
      const { data, error } = await supabase
        .from('cash_counting_entries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-counting-entries'] });
      queryClient.invalidateQueries({ queryKey: ['cash-counting-analytics'] });
    },
  });
};

/**
 * Delete a cash counting entry (admin only)
 */
export const useDeleteCashCountingEntry = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('cash_counting_entries')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-counting-entries'] });
      queryClient.invalidateQueries({ queryKey: ['cash-counting-analytics'] });
    },
  });
};

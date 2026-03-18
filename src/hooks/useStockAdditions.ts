import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { ShiftType } from '@/lib/shift-report-constants';

export interface StockAddition {
  id: number;
  created_at: string;
  addition_date: string;
  shift_type: ShiftType;
  store_location: string;
  stock_type: 'value' | 'drawer';
  item_key: string;
  quantity: number;
  notes: string | null;
  created_by: string;
}

export interface StockAdditionsFilter {
  additionDate?: string;
  shiftType?: ShiftType;
  storeLocation?: string;
  stockType?: 'value' | 'drawer';
}

// ---------------------------------------------------------------------------
// List additions with filters
// ---------------------------------------------------------------------------

export const useStockAdditions = (filters: StockAdditionsFilter = {}) => {
  const { additionDate, shiftType, storeLocation, stockType } = filters;

  return useQuery({
    queryKey: ['stock-additions', { additionDate, shiftType, storeLocation, stockType }],
    queryFn: async (): Promise<StockAddition[]> => {
      const supabase = createClient();

      let query = supabase
        .from('stock_additions')
        .select('*')
        .order('created_at', { ascending: true });

      if (additionDate) {
        query = query.eq('addition_date', additionDate);
      }
      if (shiftType) {
        query = query.eq('shift_type', shiftType);
      }
      if (storeLocation) {
        query = query.eq('store_location', storeLocation);
      }
      if (stockType) {
        query = query.eq('stock_type', stockType);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!additionDate && !!shiftType && !!storeLocation,
  });
};

// ---------------------------------------------------------------------------
// Get additions aggregated for shift report (value + drawer sums)
// ---------------------------------------------------------------------------

export const useStockAdditionsForShift = (
  additionDate: string | null | undefined,
  shiftType: ShiftType | null | undefined,
  storeLocation: string | null | undefined
) => {
  return useQuery({
    queryKey: ['stock-additions-for-shift', additionDate, shiftType, storeLocation],
    queryFn: async (): Promise<{
      valueAdded: Record<string, number>;
      drawerAdded: Record<string, number>;
    }> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('stock_additions')
        .select('stock_type, item_key, quantity')
        .eq('addition_date', additionDate!)
        .eq('shift_type', shiftType!)
        .eq('store_location', storeLocation!);

      if (error) {
        throw new Error(error.message);
      }

      const valueAdded: Record<string, number> = {};
      const drawerAdded: Record<string, number> = {};

      for (const row of data || []) {
        if (row.stock_type === 'value') {
          valueAdded[row.item_key] = (valueAdded[row.item_key] || 0) + row.quantity;
        } else {
          drawerAdded[row.item_key] = (drawerAdded[row.item_key] || 0) + row.quantity;
        }
      }

      return { valueAdded, drawerAdded };
    },
    enabled: !!additionDate && !!shiftType && !!storeLocation,
  });
};

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export const useCreateStockAddition = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (addition: Omit<StockAddition, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('stock_additions')
        .insert([addition])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-additions'] });
      queryClient.invalidateQueries({ queryKey: ['stock-additions-for-shift'] });
    },
  });
};

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export const useUpdateStockAddition = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StockAddition> & { id: number }) => {
      const { data, error } = await supabase
        .from('stock_additions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-additions'] });
      queryClient.invalidateQueries({ queryKey: ['stock-additions-for-shift'] });
    },
  });
};

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export const useDeleteStockAddition = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('stock_additions')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-additions'] });
      queryClient.invalidateQueries({ queryKey: ['stock-additions-for-shift'] });
    },
  });
};

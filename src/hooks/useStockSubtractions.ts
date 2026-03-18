import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { ShiftType } from '@/lib/shift-report-constants';

export interface StockSubtraction {
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

export interface StockSubtractionsFilter {
  additionDate?: string;
  shiftType?: ShiftType;
  storeLocation?: string;
  stockType?: 'value' | 'drawer';
}

export const useStockSubtractions = (filters: StockSubtractionsFilter = {}) => {
  const { additionDate, shiftType, storeLocation, stockType } = filters;

  return useQuery({
    queryKey: ['stock-subtractions', { additionDate, shiftType, storeLocation, stockType }],
    queryFn: async (): Promise<StockSubtraction[]> => {
      const supabase = createClient();

      let query = supabase
        .from('stock_subtractions')
        .select('*')
        .order('created_at', { ascending: true });

      if (additionDate) query = query.eq('addition_date', additionDate);
      if (shiftType) query = query.eq('shift_type', shiftType);
      if (storeLocation) query = query.eq('store_location', storeLocation);
      if (stockType) query = query.eq('stock_type', stockType);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!additionDate && !!shiftType && !!storeLocation,
  });
};

export const useStockSubtractionsForShift = (
  additionDate: string | null | undefined,
  shiftType: ShiftType | null | undefined,
  storeLocation: string | null | undefined
) => {
  return useQuery({
    queryKey: ['stock-subtractions-for-shift', additionDate, shiftType, storeLocation],
    queryFn: async (): Promise<{
      valueSubtracted: Record<string, number>;
      drawerSubtracted: Record<string, number>;
    }> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('stock_subtractions')
        .select('stock_type, item_key, quantity')
        .eq('addition_date', additionDate!)
        .eq('shift_type', shiftType!)
        .eq('store_location', storeLocation!);

      if (error) throw new Error(error.message);

      const valueSubtracted: Record<string, number> = {};
      const drawerSubtracted: Record<string, number> = {};

      for (const row of data || []) {
        if (row.stock_type === 'value') {
          valueSubtracted[row.item_key] = (valueSubtracted[row.item_key] || 0) + row.quantity;
        } else {
          drawerSubtracted[row.item_key] = (drawerSubtracted[row.item_key] || 0) + row.quantity;
        }
      }

      return { valueSubtracted, drawerSubtracted };
    },
    enabled: !!additionDate && !!shiftType && !!storeLocation,
  });
};

export const useCreateStockSubtraction = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (subtraction: Omit<StockSubtraction, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('stock_subtractions')
        .insert([subtraction])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-subtractions'] });
      queryClient.invalidateQueries({ queryKey: ['stock-subtractions-for-shift'] });
    },
  });
};

export const useDeleteStockSubtraction = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('stock_subtractions')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-subtractions'] });
      queryClient.invalidateQueries({ queryKey: ['stock-subtractions-for-shift'] });
    },
  });
};

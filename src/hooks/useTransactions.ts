import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface Transaction {
  id: number;
  created_at: string;
  shiftNumber: number;
  productId: number;
  productDescription: string;
  quantity: number;
  amount: number;
  dateTime: string;
  isGasTrn: boolean;
  typeOfGas?: string;
  volume?: number;
  pump?: number;
}

export interface TransactionsFilter {
  search?: string;
  isGasTrn?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const useTransactions = (filters: TransactionsFilter = {}) => {
  const {
    search = '',
    isGasTrn,
    startDate,
    endDate,
    page = 1,
    pageSize = 10,
  } = filters;

  return useQuery({
    queryKey: ['transactions', { search, isGasTrn, startDate, endDate, page, pageSize }],
    queryFn: async (): Promise<TransactionsResponse> => {
      const supabase = createClient();

      // Build the query
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (search) {
        query = query.or(`productDescription.ilike.%${search}%,shiftNumber.eq.${search},productId.eq.${search}`);
      }

      // Filter by transaction type (merchandise vs fuel)
      if (isGasTrn !== undefined) {
        query = query.eq('isGasTrn', isGasTrn);
      }

      // Apply date range filter on dateTime field
      if (startDate && endDate) {
        query = query
          .gte('dateTime', startDate)
          .lte('dateTime', `${endDate}T23:59:59`);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Order by dateTime descending
      query = query.order('dateTime', { ascending: false });

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

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Transaction> & { id: number }) => {
      const { data, error } = await supabase
        .from('transactions')
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
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

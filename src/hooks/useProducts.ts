import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface Product {
  id: number;
  created_at: string;
  storeId: number;
  department_id: number;
  description: string;
  price: number;
  ageRestriction: boolean;
  tax1: boolean;
  tax2: boolean;
}

export interface ProductsFilter {
  search?: string;
  departmentId?: number;
  ageRestriction?: boolean;
  tax1?: boolean;
  tax2?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const useProducts = (filters: ProductsFilter = {}) => {
  const {
    search = '',
    departmentId,
    ageRestriction,
    tax1,
    tax2,
    startDate,
    endDate,
    page = 1,
    pageSize = 10,
  } = filters;

  return useQuery({
    queryKey: ['products', { search, departmentId, ageRestriction, tax1, tax2, startDate, endDate, page, pageSize }],
    queryFn: async (): Promise<ProductsResponse> => {
      const supabase = createClient();

      // Build the query
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (search) {
        query = query.or(`description.ilike.%${search}%,storeId.eq.${search}`);
      }

      // Apply department filter
      if (departmentId !== undefined && departmentId !== null) {
        query = query.eq('department_id', departmentId);
      }

      // Apply age restriction filter
      if (ageRestriction !== undefined) {
        query = query.eq('ageRestriction', ageRestriction);
      }

      // Apply tax1 filter
      if (tax1 !== undefined) {
        query = query.eq('tax1', tax1);
      }

      // Apply tax2 filter
      if (tax2 !== undefined) {
        query = query.eq('tax2', tax2);
      }

      // Apply date range filter
      if (startDate && endDate) {
        query = query
          .gte('created_at', startDate)
          .lte('created_at', endDate);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Order by created_at descending
      query = query.order('created_at', { ascending: false });

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

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Product> & { id: number }) => {
      const { data, error } = await supabase
        .from('products')
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

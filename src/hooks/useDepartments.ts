import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface Department {
  id: number;
  created_at: string;
  store_id: number;
  description: string;
}

export interface DepartmentsFilter {
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface DepartmentsResponse {
  data: Department[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const useDepartments = (filters: DepartmentsFilter = {}) => {
  const {
    search = '',
    startDate,
    endDate,
    page = 1,
    pageSize = 10,
  } = filters;

  return useQuery({
    queryKey: ['departments', { search, startDate, endDate, page, pageSize }],
    queryFn: async (): Promise<DepartmentsResponse> => {
      const supabase = createClient();

      // Build the query
      let query = supabase
        .from('departments')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (search) {
        const isNumeric = !isNaN(Number(search));
        if (isNumeric) {
          query = query.or(`description.ilike.%${search}%,store_id.eq.${search}`);
        } else {
          query = query.ilike('description', `%${search}%`);
        }
      }

      // // Apply date range filter
      // if (startDate && endDate) {
      //   query = query
      //     .gte('created_at', startDate)
      //     .lte('created_at', endDate);
      // }

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

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch departments
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (department: Omit<Department, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('departments')
        .insert([department])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Department> & { id: number }) => {
      const { data, error } = await supabase
        .from('departments')
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
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

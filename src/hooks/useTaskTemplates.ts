import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface TaskTemplate {
  id: number;
  created_at: string;
  updated_at: string;
  task_name: string;
  description: string | null;
  day_of_week: number;
  shift_type: 'morning' | 'evening';
  store_location: string;
  is_active: boolean;
  sort_order: number;
  created_by: string;
}

export interface TaskTemplatesFilter {
  search?: string;
  dayOfWeek?: number;
  shiftType?: string;
  storeLocation?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface TaskTemplatesResponse {
  data: TaskTemplate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const useTaskTemplates = (filters: TaskTemplatesFilter = {}) => {
  const {
    search = '',
    dayOfWeek,
    shiftType,
    storeLocation,
    isActive,
    page = 1,
    pageSize = 10,
  } = filters;

  return useQuery({
    queryKey: ['task-templates', { search, dayOfWeek, shiftType, storeLocation, isActive, page, pageSize }],
    queryFn: async (): Promise<TaskTemplatesResponse> => {
      const supabase = createClient();

      let query = supabase
        .from('task_templates')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`task_name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (dayOfWeek !== undefined) {
        query = query.eq('day_of_week', dayOfWeek);
      }

      if (shiftType) {
        query = query.eq('shift_type', shiftType);
      }

      if (storeLocation) {
        query = query.eq('store_location', storeLocation);
      }

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      query = query.order('sort_order', { ascending: true }).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw new Error(error.message);

      const total = count || 0;
      return {
        data: data || [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    },
  });
};

export const useTaskTemplatesForDay = (dayOfWeek: number, shiftType: string, storeLocation: string) => {
  return useQuery({
    queryKey: ['task-templates-day', { dayOfWeek, shiftType, storeLocation }],
    queryFn: async (): Promise<TaskTemplate[]> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('shift_type', shiftType)
        .eq('store_location', storeLocation)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!shiftType && !!storeLocation,
  });
};

export const useCreateTaskTemplate = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (template: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('task_templates')
        .insert([template])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['task-templates-day'] });
    },
  });
};

export const useUpdateTaskTemplate = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskTemplate> & { id: number }) => {
      const { data, error } = await supabase
        .from('task_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['task-templates-day'] });
    },
  });
};

export const useDeleteTaskTemplate = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('task_templates')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['task-templates-day'] });
    },
  });
};

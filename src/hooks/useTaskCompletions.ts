import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface TaskCompletion {
  id: number;
  created_at: string;
  updated_at: string;
  template_id: number;
  task_date: string;
  completed_by: string;
  completed_at: string;
  image_url: string;
  notes: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  verified_by: string | null;
  verified_at: string | null;
  admin_notes: string | null;
  task_templates?: {
    task_name: string;
    description: string | null;
    shift_type: string;
    day_of_week: number;
    store_location: string;
  };
  completed_by_profile?: {
    username: string | null;
    email: string;
  };
}

export interface TaskCompletionsFilter {
  search?: string;
  taskDate?: string;
  verificationStatus?: string;
  storeLocation?: string;
  shiftType?: string;
  page?: number;
  pageSize?: number;
}

export interface TaskCompletionsResponse {
  data: TaskCompletion[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const useTaskCompletions = (filters: TaskCompletionsFilter = {}) => {
  const {
    search = '',
    taskDate,
    verificationStatus,
    storeLocation,
    shiftType,
    page = 1,
    pageSize = 10,
  } = filters;

  return useQuery({
    queryKey: ['task-completions', { search, taskDate, verificationStatus, storeLocation, shiftType, page, pageSize }],
    queryFn: async (): Promise<TaskCompletionsResponse> => {
      const supabase = createClient();

      let query = supabase
        .from('task_completions')
        .select(`
          *,
          task_templates!inner(task_name, description, shift_type, day_of_week, store_location),
          completed_by_profile:user_profiles!completed_by(username, email)
        `, { count: 'exact' });

      if (taskDate) {
        query = query.eq('task_date', taskDate);
      }

      if (verificationStatus) {
        query = query.eq('verification_status', verificationStatus);
      }

      if (storeLocation) {
        query = query.eq('task_templates.store_location', storeLocation);
      }

      if (shiftType) {
        query = query.eq('task_templates.shift_type', shiftType);
      }

      if (search) {
        query = query.ilike('task_templates.task_name', `%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      query = query.order('created_at', { ascending: false });

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

export const useTodayCompletions = (date: string, shiftType: string, storeLocation: string) => {
  return useQuery({
    queryKey: ['task-completions-today', { date, shiftType, storeLocation }],
    queryFn: async (): Promise<TaskCompletion[]> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('task_completions')
        .select(`
          *,
          task_templates!inner(task_name, description, shift_type, day_of_week, store_location),
          completed_by_profile:user_profiles!completed_by(username, email)
        `)
        .eq('task_date', date)
        .eq('task_templates.shift_type', shiftType)
        .eq('task_templates.store_location', storeLocation);

      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!date && !!shiftType && !!storeLocation,
  });
};

export const useCreateTaskCompletion = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (completion: {
      template_id: number;
      task_date: string;
      completed_by: string;
      image_url: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('task_completions')
        .insert([completion])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-completions'] });
      queryClient.invalidateQueries({ queryKey: ['task-completions-today'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
    },
  });
};

export const useUpdateTaskCompletion = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskCompletion> & { id: number }) => {
      const { data, error } = await supabase
        .from('task_completions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-completions'] });
      queryClient.invalidateQueries({ queryKey: ['task-completions-today'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
    },
  });
};

export const useVerifyTask = () => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      id,
      verification_status,
      admin_notes,
    }: {
      id: number;
      verification_status: 'approved' | 'rejected';
      admin_notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('task_completions')
        .update({
          verification_status,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          admin_notes: admin_notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-completions'] });
      queryClient.invalidateQueries({ queryKey: ['task-completions-today'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
    },
  });
};

export const useTodayTaskStats = (date: string) => {
  return useQuery({
    queryKey: ['task-stats', date],
    queryFn: async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('task_completions')
        .select('verification_status')
        .eq('task_date', date);

      if (error) throw new Error(error.message);

      const completions = data || [];
      return {
        total: completions.length,
        pending: completions.filter(c => c.verification_status === 'pending').length,
        approved: completions.filter(c => c.verification_status === 'approved').length,
        rejected: completions.filter(c => c.verification_status === 'rejected').length,
      };
    },
  });
};

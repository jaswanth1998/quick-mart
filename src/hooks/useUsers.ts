import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type UserProfile = {
  id: string;
  email: string;
  username: string | null;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type UseUsersParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export function useUsers({ search = '', page = 1, pageSize = 10 }: UseUsersParams) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['users', { search, page, pageSize }],
    queryFn: async () => {
      let query = supabase
        .from('user_profiles')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%`);
      }

      query = query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return { data: data as UserProfile[], total: count || 0 };
    },
  });
}

export function useUpdateUser() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, role, is_active }: { id: string; role?: 'admin' | 'user'; is_active?: boolean }) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (role !== undefined) updates.role = role;
      if (is_active !== undefined) updates.is_active = is_active;

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type UserProfile = {
  id: string;
  email: string;
  username: string | null;
  role: 'admin' | 'user';
  is_active: boolean;
};

export type RolePermission = {
  resource: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

export function useUserRole() {
  const supabase = createClient();

  const profileQuery = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    staleTime: 5 * 60 * 1000,
  });

  const permissionsQuery = useQuery({
    queryKey: ['role-permissions', profileQuery.data?.role],
    queryFn: async () => {
      const role = profileQuery.data?.role;
      if (!role) return [];

      const { data, error } = await supabase
        .from('role_permissions')
        .select('resource, can_view, can_create, can_edit, can_delete')
        .eq('role', role);

      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: !!profileQuery.data?.role,
    staleTime: 5 * 60 * 1000,
  });

  const hasPermission = (resource: string, action: 'can_view' | 'can_create' | 'can_edit' | 'can_delete') => {
    const perm = permissionsQuery.data?.find(p => p.resource === resource);
    return perm?.[action] ?? false;
  };

  const canView = (resource: string) => hasPermission(resource, 'can_view');

  return {
    profile: profileQuery.data ?? null,
    permissions: permissionsQuery.data ?? [],
    isAdmin: profileQuery.data?.role === 'admin',
    isLoading: profileQuery.isLoading || permissionsQuery.isLoading,
    hasPermission,
    canView,
  };
}

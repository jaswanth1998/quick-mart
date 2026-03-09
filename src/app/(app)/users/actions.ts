import { createClient } from '@/lib/supabase/client';

export async function createUserAction(data: {
  email: string;
  password: string;
  username: string;
  role: 'admin' | 'user';
  phone?: string;
}) {
  const supabase = createClient();

  const { data: result, error } = await supabase.rpc('admin_create_user', {
    p_email: data.email,
    p_password: data.password,
    p_username: data.username,
    p_role: data.role,
    p_phone: data.phone || null,
  });

  if (error) {
    return { error: error.message };
  }

  if (result?.error) {
    return { error: result.error };
  }

  return { success: true, userId: result?.user_id };
}

export async function changePasswordAction(data: {
  userId: string;
  newPassword: string;
}) {
  const supabase = createClient();

  const { data: result, error } = await supabase.rpc('admin_change_password', {
    p_user_id: data.userId,
    p_new_password: data.newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  if (result?.error) {
    return { error: result.error };
  }

  return { success: true };
}

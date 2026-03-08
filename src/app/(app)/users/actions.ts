'use server';

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function createUserAction(data: {
  email: string;
  password: string;
  username: string;
  role: 'admin' | 'user';
}) {
  // Ensure caller is authenticated
  await requireAuth();
  const supabase = await createClient();

  // Call the database function (it verifies admin role internally)
  const { data: result, error } = await supabase.rpc('admin_create_user', {
    p_email: data.email,
    p_password: data.password,
    p_username: data.username,
    p_role: data.role,
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
  await requireAuth();
  const supabase = await createClient();

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

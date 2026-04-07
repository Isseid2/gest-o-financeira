import type { AuthResponse, User } from '@supabase/supabase-js';
import { assertSupabase } from './client';

export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  return assertSupabase().auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResponse> {
  return assertSupabase().auth.signUp({ email, password });
}

export async function sendPasswordReset(email: string) {
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : undefined;

  return assertSupabase().auth.resetPasswordForEmail(email, { redirectTo });
}

export async function updateCurrentUserPassword(password: string) {
  return assertSupabase().auth.updateUser({ password });
}

export async function signOutCurrentUser() {
  return assertSupabase().auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await assertSupabase().auth.getUser();
  if (error) throw error;
  return data.user ?? null;
}

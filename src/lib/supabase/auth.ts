import type { AuthResponse, User } from '@supabase/supabase-js';
import { assertSupabase } from './client';

function getAuthRedirectUrl() {
  const configuredUrl = import.meta.env.VITE_AUTH_REDIRECT_URL;
  if (configuredUrl) return configuredUrl;

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${window.location.pathname}`;
  }

  return undefined;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  return assertSupabase().auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResponse> {
  return assertSupabase().auth.signUp({ email, password });
}

export async function sendPasswordReset(email: string) {
  const redirectTo = getAuthRedirectUrl();

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
